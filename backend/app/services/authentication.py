"""Authentication, registration, session, and 2FA business logic."""

from __future__ import annotations

import base64
import io
import logging
from typing import List, Optional, Tuple

import qrcode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.security import (
    as_utc,
    decrypt_totp_secret,
    encrypt_totp_secret,
    expiry_from_now,
    generate_recovery_codes,
    generate_token,
    generate_totp_secret,
    get_totp_uri,
    hash_password,
    hash_recovery_code,
    hash_token,
    utcnow,
    verify_password,
    verify_totp,
)
from app.models import (
    EmailVerificationToken,
    PasswordResetToken,
    RecoveryCode,
    Session,
    User,
)

logger = logging.getLogger(__name__)
settings = get_settings()


async def register_user(
    db: AsyncSession, email: str, password: str, full_name: Optional[str] = None
) -> Tuple[User, str]:
    """Create user and return (user, verification_token_plain)."""
    existing = await db.execute(select(User).where(User.email == email.lower()))
    if existing.scalar_one_or_none():
        raise ValueError("An account with this email already exists")

    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name,
        email_verified=False,
        two_factor_enabled=False,
    )
    db.add(user)
    await db.flush()

    token_plain = generate_token()
    token = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(token_plain),
        expires_at=expiry_from_now(86400 * 2),  # 48 hours
    )
    db.add(token)
    await db.flush()
    return user, token_plain


async def verify_email(db: AsyncSession, token_plain: str) -> User:
    th = hash_token(token_plain)
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == th,
            EmailVerificationToken.used == False,  # noqa: E712
        )
    )
    record = result.scalar_one_or_none()
    if not record or as_utc(record.expires_at) < utcnow():
        raise ValueError("Invalid or expired verification token")

    user = await db.get(User, record.user_id)
    if not user:
        raise ValueError("User not found")

    user.email_verified = True
    record.used = True
    await db.flush()
    return user


async def authenticate_password(
    db: AsyncSession, email: str, password: str
) -> User:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    # Generic error to avoid enumeration
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")
    if not user.email_verified:
        raise ValueError("Email address has not been verified")
    return user


async def create_pre_auth_session(
    db: AsyncSession,
    user: User,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> str:
    """Create a short-lived pre-auth session; return plain token."""
    token_plain = generate_token()
    session = Session(
        user_id=user.id,
        token_hash=hash_token(token_plain),
        is_pre_auth=True,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expiry_from_now(settings.pre_auth_max_age_seconds),
    )
    db.add(session)
    await db.flush()
    return token_plain


async def create_full_session(
    db: AsyncSession,
    user: User,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> str:
    token_plain = generate_token()
    session = Session(
        user_id=user.id,
        token_hash=hash_token(token_plain),
        is_pre_auth=False,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expiry_from_now(settings.session_max_age_seconds),
    )
    db.add(session)
    await db.flush()
    return token_plain


async def get_session_user(
    db: AsyncSession, token_plain: str, allow_pre_auth: bool = False
) -> Optional[Tuple[User, Session]]:
    th = hash_token(token_plain)
    result = await db.execute(
        select(Session).where(
            Session.token_hash == th,
            Session.revoked == False,  # noqa: E712
        )
    )
    session = result.scalar_one_or_none()
    if not session or as_utc(session.expires_at) < utcnow():
        return None
    if session.is_pre_auth and not allow_pre_auth:
        return None
    user = await db.get(User, session.user_id)
    if not user:
        return None
    session.last_seen_at = utcnow()
    return user, session


async def revoke_session(db: AsyncSession, session: Session) -> None:
    session.revoked = True
    await db.flush()


async def setup_totp(db: AsyncSession, user: User) -> Tuple[str, str, str]:
    """Generate TOTP secret, encrypt & store, return (secret, uri, qr_base64)."""
    secret = generate_totp_secret()
    user.totp_secret_encrypted = encrypt_totp_secret(secret)
    # Do not enable 2FA until first successful verification
    user.two_factor_enabled = False
    await db.flush()

    uri = get_totp_uri(secret, user.email)
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return secret, uri, qr_b64


async def activate_totp(db: AsyncSession, user: User, code: str) -> List[str]:
    """Verify first TOTP code, enable 2FA, generate recovery codes."""
    if not user.totp_secret_encrypted:
        raise ValueError("TOTP has not been enrolled")
    secret = decrypt_totp_secret(user.totp_secret_encrypted)
    if not verify_totp(secret, code):
        raise ValueError("Invalid authenticator code")

    user.two_factor_enabled = True

    # Invalidate previous recovery codes
    existing = await db.execute(
        select(RecoveryCode).where(RecoveryCode.user_id == user.id)
    )
    for rc in existing.scalars().all():
        rc.used = True

    plain_codes = generate_recovery_codes()
    for code in plain_codes:
        db.add(
            RecoveryCode(
                user_id=user.id,
                code_hash=hash_recovery_code(code),
            )
        )
    await db.flush()
    return plain_codes


async def verify_login_totp(
    db: AsyncSession, user: User, code: str
) -> bool:
    if not user.totp_secret_encrypted or not user.two_factor_enabled:
        raise ValueError("Two-factor authentication is not enabled")
    secret = decrypt_totp_secret(user.totp_secret_encrypted)
    return verify_totp(secret, code)


async def consume_recovery_code(db: AsyncSession, user: User, code: str) -> bool:
    code_h = hash_recovery_code(code)
    result = await db.execute(
        select(RecoveryCode).where(
            RecoveryCode.user_id == user.id,
            RecoveryCode.code_hash == code_h,
            RecoveryCode.used == False,  # noqa: E712
        )
    )
    rc = result.scalar_one_or_none()
    if not rc:
        return False
    rc.used = True
    await db.flush()
    return True


async def request_password_reset(db: AsyncSession, email: str) -> Optional[str]:
    """Return plain token if user exists; otherwise None (no enumeration)."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        return None
    token_plain = generate_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(token_plain),
            expires_at=expiry_from_now(3600),
        )
    )
    await db.flush()
    return token_plain


async def reset_password(db: AsyncSession, token_plain: str, new_password: str) -> User:
    th = hash_token(token_plain)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == th,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    record = result.scalar_one_or_none()
    if not record or as_utc(record.expires_at) < utcnow():
        raise ValueError("Invalid or expired reset token")

    user = await db.get(User, record.user_id)
    if not user:
        raise ValueError("User not found")

    user.password_hash = hash_password(new_password)
    record.used = True
    # Revoke all sessions on password change
    sessions = await db.execute(
        select(Session).where(Session.user_id == user.id, Session.revoked == False)
    )
    for s in sessions.scalars().all():
        s.revoked = True
    await db.flush()
    return user
