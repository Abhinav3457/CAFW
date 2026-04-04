import os
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv

try:
    import aiosmtplib
except ImportError:
    aiosmtplib = None

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "").strip()
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USERNAME).strip()


def _env_flag(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


EMAIL_USE_TLS = _env_flag("EMAIL_USE_TLS", EMAIL_PORT == 465)
EMAIL_START_TLS = _env_flag("EMAIL_START_TLS", EMAIL_PORT not in {25, 465})


def _validate_email_settings() -> None:
    missing = [
        name
        for name, value in {
            "EMAIL_USERNAME": EMAIL_USERNAME,
            "EMAIL_PASSWORD": EMAIL_PASSWORD,
            "EMAIL_FROM": EMAIL_FROM,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Email delivery is not configured. Missing: "
            + ", ".join(missing)
        )


def _build_send_kwargs() -> dict:
    send_kwargs = {
        "hostname": EMAIL_HOST,
        "port": EMAIL_PORT,
        "username": EMAIL_USERNAME,
        "password": EMAIL_PASSWORD,
        "timeout": 10,
    }
    if EMAIL_USE_TLS:
        send_kwargs["use_tls"] = True
    else:
        send_kwargs["start_tls"] = EMAIL_START_TLS
    return send_kwargs


def _send_with_smtplib(msg: MIMEMultipart) -> None:
    if EMAIL_USE_TLS:
        with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT, timeout=10) as smtp:
            smtp.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            smtp.send_message(msg)
        return

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10) as smtp:
        if EMAIL_START_TLS:
            smtp.starttls()
        smtp.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        smtp.send_message(msg)

async def send_otp_email(to_email: str, otp: str, purpose: str = "login"):
    _validate_email_settings()

    purposes = {
        "login":    ("CAFW Login Verification", "sign in to"),
        "register": ("CAFW Email Verification", "verify your email for"),
        "reset":    ("CAFW Password Reset",     "reset your password for"),
    }

    subject, action = purposes.get(purpose, purposes["login"])

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#060d1a;
      font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#060d1a;padding:40px 20px;">
        <tr><td align="center">
          <table width="500" cellpadding="0" cellspacing="0"
            style="background:#0d1424;border-radius:14px;
            border:1px solid #1a2540;overflow:hidden;">

            <tr>
              <td style="background:linear-gradient(135deg,#0d2050,#1e3a8a);
                padding:28px;text-align:center;">
                <div style="font-size:32px;margin-bottom:8px;">CAFW</div>
                <h1 style="color:#e2e8f0;font-size:20px;
                  font-weight:700;margin:0;">
                  Firewall Admin Dashboard
                </h1>
                <p style="color:#60a5fa;font-size:12px;
                  margin:6px 0 0;letter-spacing:.5px;">
                  CENTRALIZED APPLICATION-CONTEXT AWARE FIREWALL
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 36px;">
                <h2 style="color:#e2e8f0;font-size:16px;
                  font-weight:600;margin:0 0 10px;">
                  Your verification code
                </h2>
                <p style="color:#64748b;font-size:13px;
                  line-height:1.6;margin:0 0 24px;">
                  Use this OTP to {action} your CAFW account.
                  This code expires in <strong
                  style="color:#94a3b8;">5 minutes</strong>.
                  Do not share it with anyone.
                </p>

                <div style="background:#080f1e;
                  border:2px solid #1e3a8a;
                  border-radius:12px;padding:24px;
                  text-align:center;margin-bottom:24px;">
                  <div style="font-size:44px;font-weight:800;
                    letter-spacing:18px;color:#3b82f6;
                    font-family:monospace;
                    text-shadow:0 0 20px rgba(59,130,246,0.4);">
                    {otp}
                  </div>
                  <div style="font-size:11px;color:#334155;
                    margin-top:10px;letter-spacing:.5px;">
                    ONE-TIME PASSWORD | VALID FOR 5 MINUTES
                  </div>
                </div>

                <div style="background:#0a1628;
                  border:1px solid #1e2d4a;
                  border-left:3px solid #f59e0b;
                  border-radius:0 8px 8px 0;
                  padding:12px 14px;margin-bottom:20px;">
                  <p style="color:#fbbf24;font-size:12px;
                    margin:0;line-height:1.6;">
                    Warning: <strong>Security notice:</strong>
                    Never share this OTP with anyone.
                    CAFW staff will never ask for your OTP.
                  </p>
                </div>

                <p style="color:#334155;font-size:12px;
                  margin:0;line-height:1.6;">
                  If you didn't request this code, please ignore
                  this email. Your account remains secure.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#080f1e;padding:16px 36px;
                border-top:1px solid #1a2540;text-align:center;">
                <p style="color:#334155;font-size:11px;margin:0;">
                  CAFW v1.0.0 | All activity is monitored and logged<br>
                  This is an automated message - do not reply
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"CAFW Security <{EMAIL_FROM}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    if aiosmtplib is not None:
        await aiosmtplib.send(msg, **_build_send_kwargs())
        return

    await asyncio.to_thread(_send_with_smtplib, msg)

