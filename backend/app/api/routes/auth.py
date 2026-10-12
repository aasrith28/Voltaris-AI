"""Authentication routes: register, login, 2FA, password reset."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.schemas.auth import (
    AuthSuccessResponse,
    EmailVerifyRequest,
    LoginRequest,
    LoginResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RecoveryCodeRequest,
    RecoveryCodesResponse,
    RegisterRequest,
    TotpVerifyRequest,
    TwoFactorSetupResponse,
    UserResponse,
)
from app.services import authentication as auth_svc

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_session_cookie(response: Response, token: str, max_age: int) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
    )


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, verify_token = await auth_svc.register_user(
            db, body.email, body.password, body.full_name
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Development: return verification token so local testing works without email
    payload = {
        "message": "Registration successful. Verify your email to continue.",
        "email": user.email,
        "user_id": user.id,
    }
    if settings.email_provider == "console" or settings.debug:
        payload["dev_verification_token"] = verify_token
        payload["dev_note"] = (
            "Email provider is console/debug. Use this token with "
            "POST /api/v1/auth/verify-email"
        )
    return payload


@router.post("/verify-email")
async def verify_email(body: EmailVerifyRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_svc.verify_email(db, body.token)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "message": "Email verified. You may now log in and set up two-factor authentication.",
        "email": user.email,
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await auth_svc.authenticate_password(db, body.email, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None

    if user.two_factor_enabled:
        pre_token = await auth_svc.create_pre_auth_session(db, user, ua, ip)
        _set_session_cookie(
            response, pre_token, settings.pre_auth_max_age_seconds
        )
        return LoginResponse(requires_2fa=True, pre_auth_token=pre_token)

    # First-time users without 2FA still get a session but must enroll 2FA
    token = await auth_svc.create_full_session(db, user, ua, ip)
    _set_session_cookie(response, token, settings.session_max_age_seconds)
    return {
        "requires_2fa": False,
        "requires_2fa_setup": not user.two_factor_enabled,
        "user": UserResponse.model_validate(user),
        "message": (
            "Authenticated. Please enroll two-factor authentication."
            if not user.two_factor_enabled
            else "Authenticated"
        ),
    }


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await auth_svc.get_session_user(db, token, allow_pre_auth=False)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user, _ = result
    secret, uri, qr = await auth_svc.setup_totp(db, user)
    return TwoFactorSetupResponse(
        secret=secret,
        provisioning_uri=uri,
        qr_code_base64=qr,
    )


@router.post("/2fa/activate", response_model=RecoveryCodesResponse)
async def activate_2fa(
    body: TotpVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await auth_svc.get_session_user(db, token, allow_pre_auth=False)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user, _ = result
    try:
        codes = await auth_svc.activate_totp(db, user, body.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RecoveryCodesResponse(codes=codes)


@router.post("/2fa/verify")
async def verify_2fa(
    body: TotpVerifyRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Pre-authentication required")
    result = await auth_svc.get_session_user(db, token, allow_pre_auth=True)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired pre-auth session")
    user, pre_session = result
    if not pre_session.is_pre_auth:
        raise HTTPException(status_code=400, detail="Already fully authenticated")

    try:
        ok = await auth_svc.verify_login_totp(db, user, body.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid authenticator code")

    await auth_svc.revoke_session(db, pre_session)
    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    full_token = await auth_svc.create_full_session(db, user, ua, ip)
    _set_session_cookie(response, full_token, settings.session_max_age_seconds)
    return AuthSuccessResponse(user=UserResponse.model_validate(user))


@router.post("/2fa/recover")
async def recover_with_code(
    body: RecoveryCodeRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Pre-authentication required")
    result = await auth_svc.get_session_user(db, token, allow_pre_auth=True)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired pre-auth session")
    user, pre_session = result

    ok = await auth_svc.consume_recovery_code(db, user, body.code)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid or already used recovery code")

    await auth_svc.revoke_session(db, pre_session)
    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    full_token = await auth_svc.create_full_session(db, user, ua, ip)
    _set_session_cookie(response, full_token, settings.session_max_age_seconds)
    return AuthSuccessResponse(
        user=UserResponse.model_validate(user),
        message="Authenticated with recovery code",
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        result = await auth_svc.get_session_user(db, token, allow_pre_auth=True)
        if result:
            _, session = result
            await auth_svc.revoke_session(db, session)
    _clear_session_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await auth_svc.get_session_user(db, token, allow_pre_auth=False)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user, _ = result
    return UserResponse.model_validate(user)


@router.post("/password-reset/request")
async def password_reset_request(
    body: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    token = await auth_svc.request_password_reset(db, body.email)
    payload = {
        "message": "If an account exists for that email, a reset link has been issued."
    }
    if token and (settings.email_provider == "console" or settings.debug):
        payload["dev_reset_token"] = token
    return payload


@router.post("/password-reset/confirm")
async def password_reset_confirm(
    body: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
):
    try:
        await auth_svc.reset_password(db, body.token, body.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"message": "Password has been reset. Please log in again."}
