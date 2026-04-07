from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pathlib import Path
from app.database import get_db
from app.models import AdminUser, SystemConfig
from app.email_service import send_otp_email, validate_email_settings
import hashlib, secrets, time, os
from dotenv import load_dotenv

try:
    from jose import JWTError, jwt
except ImportError:
    import jwt
    from jwt import InvalidTokenError as JWTError

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

router     = APIRouter(prefix="/auth", tags=["Auth"])
security   = HTTPBearer(auto_error=False)

def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(
            f"{name} is not configured. Set it in the backend environment or .env file."
        )
    return value


SECRET_KEY     = _require_env("SECRET_KEY")
PROVISION_KEY  = os.getenv("PROVISION_KEY", "").strip()
ALGORITHM      = "HS256"
TOKEN_EXPIRE   = 60 * 60 * 8   # 8 hours

LOCKOUT_ATTEMPTS = 3
LOCKOUT_SECONDS  = 30

otp_store     = {}
lockout_store = {}

# ─── helpers ───────────────────────────────────────────────

def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()

def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)

def cleanup_expired_state():
    now = time.time()

    expired_otps = [
        email for email, entry in otp_store.items()
        if entry.get("expires", 0) <= now
    ]
    for email in expired_otps:
        otp_store.pop(email, None)

    expired_lockouts = [
        email for email, entry in lockout_store.items()
        if entry.get("until", 0) and entry.get("until", 0) <= now
    ]
    for email in expired_lockouts:
        lockout_store.pop(email, None)

def log_otp_issued(event: str, email: str):
    print(f"[{event}] OTP issued for {email}")

def create_token(email: str, full_name: str) -> str:
    payload = {
        "sub":       email,
        "name":      full_name,
        "iat":       int(time.time()),
        "exp":       int(time.time()) + TOKEN_EXPIRE,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return verify_token(credentials.credentials)

def is_setup_done(db: Session) -> bool:
    cfg = db.query(SystemConfig).filter(
        SystemConfig.key == "setup_complete"
    ).first()
    return cfg is not None and cfg.value == "true"

def mark_setup_done(db: Session):
    cfg = db.query(SystemConfig).filter(
        SystemConfig.key == "setup_complete"
    ).first()
    if cfg:
        cfg.value = "true"
    else:
        db.add(SystemConfig(key="setup_complete", value="true"))
    db.commit()

def check_lockout(email: str):
    cleanup_expired_state()
    entry = lockout_store.get(email)
    if not entry:
        return
    if time.time() < entry["until"]:
        remaining = int(entry["until"] - time.time())
        raise HTTPException(
            status_code=423,
            detail=f"Account locked. Try again in {remaining} seconds."
        )
    else:
        del lockout_store[email]

def record_failed(email: str):
    now   = time.time()
    entry = lockout_store.get(email, {"attempts": 0, "until": 0})
    if now > entry.get("until", 0):
        entry["attempts"] = 0
    entry["attempts"] += 1
    if entry["attempts"] >= LOCKOUT_ATTEMPTS:
        entry["until"]    = now + LOCKOUT_SECONDS
        entry["attempts"] = 0
        lockout_store[email] = entry
        raise HTTPException(
            status_code=423,
            detail=f"Too many failed attempts. Locked for {LOCKOUT_SECONDS} seconds."
        )
    lockout_store[email] = entry

def clear_lockout(email: str):
    lockout_store.pop(email, None)

def verify_otp_internal(email: str, otp: str, expected_type: str):
    cleanup_expired_state()
    entry = otp_store.get(email)
    if not entry:
        raise HTTPException(status_code=400,
                            detail="No pending verification. Please start again.")
    if entry.get("type") != expected_type:
        raise HTTPException(status_code=400,
                            detail="Invalid session. Please start again.")
    if time.time() > entry["expires"]:
        del otp_store[email]
        raise HTTPException(status_code=400,
                            detail="OTP expired. Please request a new one.")
    entry["attempts"] = entry.get("attempts", 0) + 1
    if entry["attempts"] > 5:
        del otp_store[email]
        raise HTTPException(status_code=400,
                            detail="Too many wrong attempts. Please start again.")
    if entry["otp"] != otp.strip():
        remaining = 5 - entry["attempts"]
        raise HTTPException(status_code=400,
                            detail=f"Invalid OTP. {remaining} attempt(s) remaining.")
    del otp_store[email]
    return entry

# ─── schemas ───────────────────────────────────────────────

class SetupRequest(BaseModel):
    full_name:      str
    email:          str
    password:       str
    provision_key:  str

class VerifySetupRequest(BaseModel):
    email:  str
    otp:    str

class LoginRequest(BaseModel):
    email:    str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp:   str

class OTPRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email:        str
    otp:          str
    new_password: str

# ─── routes ────────────────────────────────────────────────

@router.get("/status")
def get_status(db: Session = Depends(get_db)):
    """Frontend calls this to know if setup is done."""
    return {"setup_complete": is_setup_done(db)}


@router.post("/setup")
async def setup(data: SetupRequest, db: Session = Depends(get_db)):
    """One-time admin provisioning — only works before setup is complete."""
    cleanup_expired_state()
    if is_setup_done(db):
        raise HTTPException(status_code=403,
                            detail="System already configured. Admin registration is closed.")

    if not PROVISION_KEY:
        raise HTTPException(
            status_code=503,
            detail="Admin provisioning is not configured on the server.",
        )

    if data.provision_key != PROVISION_KEY:
        raise HTTPException(status_code=403,
                            detail="Invalid provisioning key.")

    data.email = data.email.lower().strip()

    if len(data.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name is too short.")
    if len(data.password) < 8:
        raise HTTPException(status_code=400,
                            detail="Password must be at least 8 characters.")

    existing = db.query(AdminUser).filter(
        AdminUser.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400,
                            detail="Email already registered.")

    if not validate_email_settings():
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Contact administrator to set EMAIL_USERNAME and EMAIL_PASSWORD environment variables."
        )

    otp = generate_otp()
    otp_store[data.email] = {
        "otp":      otp,
        "expires":  time.time() + 300,
        "type":     "setup",
        "attempts": 0,
        "pending": {
            "full_name":     data.full_name.strip(),
            "email":         data.email,
            "password_hash": hash_password(data.password)
        }
    }

    try:
        await send_otp_email(data.email, otp, "register")
    except Exception as e:
        print(f"[SETUP OTP WARNING] Failed to send OTP to {data.email}: {e}")
        return {
            "message": f"OTP generated for {data.email}, but email delivery failed. Use the OTP shown in server logs.",
            "otp": otp,
        }

    log_otp_issued("SETUP OTP", data.email)
    return {"message": f"OTP sent to {data.email}. Valid for 5 minutes."}


@router.post("/verify-setup")
def verify_setup(data: VerifySetupRequest, db: Session = Depends(get_db)):
    if is_setup_done(db):
        raise HTTPException(status_code=403,
                            detail="System already configured.")

    data.email = data.email.lower().strip()
    entry = verify_otp_internal(data.email, data.otp, "setup")
    pending = entry["pending"]

    user = AdminUser(
        full_name=pending["full_name"],
        email=pending["email"],
        password_hash=pending["password_hash"]
    )
    db.add(user)
    mark_setup_done(db)
    return {"message": "Admin account created. System is now secured."}


@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    cleanup_expired_state()
    data.email = data.email.lower().strip()
    check_lockout(data.email)

    user = db.query(AdminUser).filter(
        AdminUser.email == data.email).first()
    if not user or user.password_hash != hash_password(data.password):
        record_failed(data.email)
        raise HTTPException(status_code=401,
                            detail="Invalid email or password.")

    clear_lockout(data.email)

    if not validate_email_settings():
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Contact administrator to set EMAIL_USERNAME and EMAIL_PASSWORD environment variables."
        )

    otp = generate_otp()
    otp_store[data.email] = {
        "otp":      otp,
        "expires":  time.time() + 300,
        "type":     "login",
        "attempts": 0,
    }

    try:
        await send_otp_email(data.email, otp, "login")
    except Exception as e:
        del otp_store[data.email]
        raise HTTPException(status_code=500,
                            detail=f"Failed to send OTP: {str(e)[:100]}")

    log_otp_issued("LOGIN OTP", data.email)
    return {"message": f"OTP sent to {data.email}."}


@router.post("/verify-login")
def verify_login(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    data.email = data.email.lower().strip()
    verify_otp_internal(data.email, data.otp, "login")

    user = db.query(AdminUser).filter(
        AdminUser.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    token = create_token(user.email, user.full_name)
    return {
        "message": "Login successful.",
        "token":   token,
        "user":    {"full_name": user.full_name, "email": user.email}
    }


@router.post("/forgot-password")
async def forgot_password(data: OTPRequest, db: Session = Depends(get_db)):
    cleanup_expired_state()
    data.email = data.email.lower().strip()
    user = db.query(AdminUser).filter(
        AdminUser.email == data.email).first()
    if not user:
        return {"message": "If that email exists, an OTP has been sent."}

    if not validate_email_settings():
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Contact administrator to set EMAIL_USERNAME and EMAIL_PASSWORD environment variables."
        )

    otp = generate_otp()
    otp_store[data.email] = {
        "otp":      otp,
        "expires":  time.time() + 300,
        "type":     "reset",
        "attempts": 0,
    }

    try:
        await send_otp_email(data.email, otp, "reset")
    except Exception as e:
        del otp_store[data.email]
        raise HTTPException(status_code=500,
                            detail=f"Failed to send OTP: {str(e)[:100]}")

    log_otp_issued("RESET OTP", data.email)
    return {"message": f"OTP sent to {data.email}."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    data.email = data.email.lower().strip()
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400,
                            detail="Password must be at least 8 characters.")
    verify_otp_internal(data.email, data.otp, "reset")
    user = db.query(AdminUser).filter(
        AdminUser.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successfully."}



@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
