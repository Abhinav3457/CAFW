import os
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import aiosmtplib

from dotenv import load_dotenv

load_dotenv()

# ENV VARIABLES
def _clean(value: str | None, default: str = "") -> str:
    if value is None:
        return default
    return value.strip().strip('"').strip("'")


EMAIL_HOST = _clean(os.getenv("EMAIL_HOST"), "smtp.gmail.com")


def _parse_port(value: str) -> int:
    try:
        return int((value or "").strip())
    except ValueError:
        return 587


EMAIL_PORT = _parse_port(_clean(os.getenv("EMAIL_PORT", "587"), "587"))
EMAIL_USERNAME = _clean(os.getenv("EMAIL_USERNAME"))
EMAIL_PASSWORD = _clean(os.getenv("EMAIL_PASSWORD"))
EMAIL_FROM = _clean(os.getenv("EMAIL_FROM"), EMAIL_USERNAME)
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "false").lower() == "true"
EMAIL_START_TLS = os.getenv("EMAIL_START_TLS", "true").lower() == "true"
SMTP_TIMEOUT = 8


def validate_email_settings():
    """Check if email credentials are available. Returns True if ok, False otherwise."""
    return bool(EMAIL_USERNAME and EMAIL_PASSWORD)


def _send_ssl(msg):
    with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT, timeout=SMTP_TIMEOUT) as server:
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)


def _send_smtp(msg, use_starttls: bool):
    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=SMTP_TIMEOUT) as server:
        if use_starttls:
            server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)


def send_email_sync(msg):
    # Primary mode follows env flags. Secondary mode is inferred from common SMTP ports.
    attempts = []
    if EMAIL_USE_TLS:
        attempts.append("ssl")
    else:
        attempts.append("starttls" if EMAIL_START_TLS else "plain")

    if EMAIL_PORT == 465 and "ssl" not in attempts:
        attempts.append("ssl")
    if EMAIL_PORT == 587 and "starttls" not in attempts:
        attempts.append("starttls")

    last_error = None
    for mode in attempts:
        try:
            if mode == "ssl":
                _send_ssl(msg)
            elif mode == "starttls":
                _send_smtp(msg, use_starttls=True)
            else:
                _send_smtp(msg, use_starttls=False)
            return
        except (smtplib.SMTPException, OSError) as exc:
            last_error = exc

    raise Exception(f"SMTP delivery failed: {last_error}")


async def _send_email_async(msg):
    try:
        await aiosmtplib.send(
            msg,
            hostname=EMAIL_HOST,
            port=EMAIL_PORT,
            username=EMAIL_USERNAME,
            password=EMAIL_PASSWORD,
            use_tls=EMAIL_USE_TLS,
            start_tls=(False if EMAIL_USE_TLS else EMAIL_START_TLS),
            timeout=SMTP_TIMEOUT,
        )
    except Exception:
        # Fallback to stdlib path for providers with strict protocol quirks.
        await asyncio.to_thread(send_email_sync, msg)


async def send_otp_email(to_email: str, otp: str, purpose: str = "login"):
    if not validate_email_settings():
        raise Exception("Email credentials not configured on server")

    subject_map = {
        "login": "CAFW Login Verification",
        "register": "CAFW Email Verification",
        "reset": "CAFW Password Reset",
    }

    subject = subject_map.get(purpose, "CAFW OTP Verification")

    html = f"""
    <html>
    <body style="font-family:sans-serif;">
        <h2>Your OTP Code</h2>
        <p>Use this OTP to proceed. It expires in 5 minutes.</p>
        <h1>{otp}</h1>
        <p>If you didn't request this, ignore this email.</p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"CAFW Security <{EMAIL_FROM}>"
    msg["To"] = to_email

    msg.attach(MIMEText(html, "html"))

    await _send_email_async(msg)
