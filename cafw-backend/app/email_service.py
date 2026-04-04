import os
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

# ENV VARIABLES
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = 587  # FORCE correct port
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USERNAME)


def validate_email_settings():
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        raise Exception("Email credentials are missing")


def send_email_sync(msg):
    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10) as server:
        server.starttls()  # IMPORTANT
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