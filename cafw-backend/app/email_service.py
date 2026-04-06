import os
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

# ENV VARIABLES
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USERNAME)
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "false").lower() == "true"
EMAIL_START_TLS = os.getenv("EMAIL_START_TLS", "true").lower() == "true"

print("EMAIL CONFIG:", EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_START_TLS)
def validate_email_settings():
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        raise Exception("Email credentials are missing")


def send_email_sync(msg):
    # Respect deployment SMTP mode: implicit TLS (e.g. 465) or STARTTLS (e.g. 587).
    if EMAIL_USE_TLS:
        with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT, timeout=15) as server:
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(msg)
        return

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=15) as server:
        if EMAIL_START_TLS:
            server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)


async def send_otp_email(to_email: str, otp: str, purpose: str = "login"):
    validate_email_settings()

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

    # run blocking code in thread
    await asyncio.to_thread(send_email_sync, msg)
