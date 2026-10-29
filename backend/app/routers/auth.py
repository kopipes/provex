import hashlib
import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PasswordResetToken, AuditLog
from app.schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.notiv import send_notification, notiv_enabled
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with pending status
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="user",
        status="pending",
        department=user_data.department
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not active. Please wait for approval."
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# ============ Forgot / reset password ============

RESET_TOKEN_TTL_MINUTES = int(os.getenv("PASSWORD_RESET_TTL_MINUTES", "30"))
RESET_THROTTLE_SECONDS = 60
APP_BASE_URL = os.getenv("APP_BASE_URL", "").rstrip("/")


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _send_reset_notification(email: str, name: str, token: str) -> None:
    """Background task: deliver the reset link through Notiv.

    Runs after the response is sent, so a Notiv failure cannot affect the
    request outcome or reveal whether the address exists.
    """
    action_url = None
    if APP_BASE_URL:
        action_url = f"{APP_BASE_URL}/reset-password?token={token}"

    message = (
        f"Halo {name},\n\n"
        f"Kami menerima permintaan untuk mengatur ulang password akun ProvEx Anda.\n\n"
        f"Kode reset Anda: {token}\n\n"
        f"Kode ini berlaku {RESET_TOKEN_TTL_MINUTES} menit dan hanya dapat digunakan sekali. "
        f"Abaikan pesan ini jika Anda tidak meminta reset password."
    )

    send_notification(
        recipient_email=email,
        title="Reset Password ProvEx",
        message=message,
        event_id=f"provex-password-reset-{_hash_token(token)[:32]}",
        action_url=action_url,
        notification_type="password_reset",
    )


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Request a password reset link.

    Always returns the same response so the endpoint cannot be used to
    discover which email addresses have accounts.
    """
    email = (payload.email or "").strip().lower()
    user = db.query(User).filter(User.email.ilike(email)).first()

    if user and user.status == "active":
        now = datetime.utcnow()

        # Throttle: ignore requests made within RESET_THROTTLE_SECONDS
        recent = (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.created_at >= now - timedelta(seconds=RESET_THROTTLE_SECONDS),
            )
            .first()
        )

        if not recent:
            raw_token = secrets.token_urlsafe(32)
            db.add(
                PasswordResetToken(
                    user_id=user.id,
                    token_hash=_hash_token(raw_token),
                    expires_at=now + timedelta(minutes=RESET_TOKEN_TTL_MINUTES),
                )
            )
            db.add(
                AuditLog(
                    user_id=user.id,
                    action="password_reset_requested",
                    target_type="user",
                    target_id=user.id,
                    details="Password reset requested",
                )
            )
            db.commit()
            background_tasks.add_task(
                _send_reset_notification, user.email, user.name, raw_token
            )

    return {
        "message": (
            "Jika email terdaftar dan aktif, kode reset password telah dikirim "
            "melalui Notiv."
        ),
        "channel_enabled": notiv_enabled(),
    }


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Complete a password reset with the token delivered by Notiv."""
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password minimal 6 karakter",
        )

    token_hash = _hash_token(payload.token.strip())
    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode reset tidak valid",
        )

    now = datetime.utcnow()
    if record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode reset sudah pernah digunakan",
        )
    if record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode reset sudah kedaluwarsa. Silakan minta kode baru.",
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode reset tidak valid",
        )

    user.password_hash = get_password_hash(payload.new_password)
    record.used_at = now

    # Invalidate any other outstanding tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now})

    db.add(
        AuditLog(
            user_id=user.id,
            action="password_reset_completed",
            target_type="user",
            target_id=user.id,
            details="Password changed via reset token",
        )
    )
    db.commit()

    return {"message": "Password berhasil diubah. Silakan masuk dengan password baru."}
