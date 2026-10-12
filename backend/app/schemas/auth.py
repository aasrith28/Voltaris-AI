"""Authentication request/response schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=10, max_length=128)
    full_name: Optional[str] = Field(None, max_length=120)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TotpVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=8)


class RecoveryCodeRequest(BaseModel):
    code: str = Field(..., min_length=8, max_length=32)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=10, max_length=128)


class EmailVerifyRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    email_verified: bool
    two_factor_enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    id: str
    created_at: datetime
    last_seen_at: datetime
    user_agent: Optional[str]
    ip_address: Optional[str]
    is_current: bool = False


class LoginResponse(BaseModel):
    """Returned after password check when 2FA is required."""
    requires_2fa: bool = True
    pre_auth_token: str
    message: str = "Enter the code from your authenticator app"


class AuthSuccessResponse(BaseModel):
    user: UserResponse
    message: str = "Authenticated"


class TwoFactorSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code_base64: str
    message: str = "Scan the QR code with your authenticator app, then verify with a code"


class RecoveryCodesResponse(BaseModel):
    codes: List[str]
    message: str = (
        "Store these recovery codes securely. Each code can be used only once. "
        "Previous recovery codes have been invalidated."
    )
