import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST     = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT     = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM     = os.getenv("EMAIL_FROM", "")

async def send_otp_email(to_email: str, otp: str, purpose: str = "login"):

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
                <div style="font-size:32px;margin-bottom:8px;">🛡</div>
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
                    ONE-TIME PASSWORD · VALID FOR 5 MINUTES
                  </div>
                </div>

                <div style="background:#0a1628;
                  border:1px solid #1e2d4a;
                  border-left:3px solid #f59e0b;
                  border-radius:0 8px 8px 0;
                  padding:12px 14px;margin-bottom:20px;">
                  <p style="color:#fbbf24;font-size:12px;
                    margin:0;line-height:1.6;">
                    ⚠ <strong>Security notice:</strong>
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
                  CAFW v1.0.0 · All activity is monitored and logged<br>
                  This is an automated message — do not reply
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
    msg["From"]    = f"CAFW Security <{EMAIL_FROM}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=EMAIL_HOST,
        port=EMAIL_PORT,
        username=EMAIL_USERNAME,
        password=EMAIL_PASSWORD,
        start_tls=True,
    )