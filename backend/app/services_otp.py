from __future__ import annotations

import secrets
import smtplib
import base64
import json
from pathlib import Path
from email.message import EmailMessage
from http.client import HTTPSConnection
from mimetypes import guess_type
from urllib.parse import urlencode

from fastapi import HTTPException, status

from app.core.config import settings


LOGO_CANDIDATE_PATHS = (
        Path(__file__).resolve().parents[2] / "src" / "assets" / "logo.webp",
        Path(__file__).resolve().parents[2] / "src" / "assets" / "Nav" / "logo.png",
)


def _load_brand_logo() -> tuple[bytes, str, str, str] | None:
        for candidate in LOGO_CANDIDATE_PATHS:
                if not candidate.exists() or not candidate.is_file():
                        continue

                content_type = guess_type(str(candidate))[0] or "image/png"
                maintype, subtype = content_type.split("/", 1)
                return candidate.read_bytes(), maintype, subtype, candidate.name

        return None


def _build_password_reset_html(otp: str) -> str:
        expiry_minutes = settings.otp_expiry_minutes
        return f"""<!DOCTYPE html>
<html lang=\"en\">
    <head>
        <meta charset=\"UTF-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
        <title>Tiffin Delight OTP</title>
    </head>
    <body style=\"margin:0;padding:0;background:#f5f8f4;font-family:Arial,Helvetica,sans-serif;color:#213226;\">
        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f5f8f4;padding:24px 12px;\">
            <tr>
                <td align=\"center\">
                    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:480px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(18,74,48,0.12);\">
                        <tr>
                            <td align=\"center\" style=\"padding:30px 20px;background:linear-gradient(180deg,#edf7ec 0%,#e4f1e2 100%);\">
                                <img src=\"cid:tiffin-delight-logo\" alt=\"Tiffin Delight\" style=\"max-width:200px;width:100%;height:auto;display:block;margin:0 auto 8px auto;\" />
                                <div style=\"font-size:14px;color:#3f654e;\">Subscription Tiffin Service</div>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:24px 28px 0 28px;text-align:center;\">
                                <h1 style=\"margin:0;font-size:26px;line-height:1.3;color:#0f5c35;font-weight:700;\">Reset your password</h1>
                                <p style=\"margin:12px 0 0 0;font-size:16px;line-height:1.6;color:#355843;\">Let\'s get you back to your meals quickly.</p>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:20px 28px 0 28px;\">
                                <p style=\"margin:0;font-size:15px;line-height:1.7;color:#425f4b;text-align:center;\">
                                    We received a request to reset your password for your Tiffin Delight account.
                                    Use the verification code below to continue.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:24px 28px 0 28px;\">
                                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ecf8ea;border-radius:10px;border:1px solid #d4ead1;box-shadow:0 2px 8px rgba(22,85,51,0.08);\">
                                    <tr>
                                        <td style=\"padding:18px 18px 8px 18px;text-align:center;color:#2d6042;font-size:14px;\">Your verification code</td>
                                    </tr>
                                    <tr>
                                        <td style=\"padding:0 18px 20px 18px;text-align:center;color:#0e5633;font-size:34px;font-weight:700;letter-spacing:8px;\">{otp}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:14px 28px 0 28px;text-align:center;\">
                                <p style=\"margin:0;font-size:13px;color:#5d7666;\">Valid for {expiry_minutes} minutes only.</p>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:18px 28px 0 28px;\">
                                <p style=\"margin:0;font-size:14px;line-height:1.6;color:#415a4b;text-align:center;\">
                                    For your safety, never share this code with anyone.<br />
                                    Tiffin Delight will never ask for your OTP.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:14px 28px 0 28px;\">
                                <p style=\"margin:0;font-size:14px;line-height:1.6;color:#2e5640;text-align:center;\">
                                    We\'re here to keep your meals and your account safe.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style=\"padding:40px 28px 30px 28px;background:#f8fbf7;border-top:1px solid #e2eee0;text-align:center;\">
                                <p style=\"margin:0;font-size:15px;color:#0f5c35;font-weight:700;\">Tiffin Delight</p>
                                <p style=\"margin:6px 0 0 0;font-size:13px;color:#516c5d;\">Subscription Tiffin Service</p>
                                <p style=\"margin:14px 0 0 0;font-size:13px;color:#516c5d;\">
                                    hello@tiffindelight.in<br />
                                    +91 98765 43210<br />
                                    HSR Layout, Bengaluru
                                </p>
                                <p style=\"margin:14px 0 0 0;font-size:12px;color:#6a816f;\">Fresh meal plans for students, offices, and busy homes.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
"""


def generate_numeric_otp() -> str:
    if settings.otp_code_length <= 0:
        raise HTTPException(status_code=500, detail="Invalid OTP configuration")

    max_value = 10 ** settings.otp_code_length
    value = secrets.randbelow(max_value)
    return str(value).zfill(settings.otp_code_length)


def send_email_otp(email: str, otp: str) -> None:
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password or not settings.smtp_from_email:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email OTP provider is not configured on server.",
        )

    message = EmailMessage()
    message["Subject"] = "Reset your Tiffin Delight password - verification code inside"
    message["From"] = settings.smtp_from_email
    message["To"] = email
    message.set_content(
        "Tiffin Delight password reset\n\n"
        f"Your verification code is {otp}.\n"
        f"Valid for {settings.otp_expiry_minutes} minutes only.\n\n"
        "For your safety, never share this code with anyone."
    )
    message.add_alternative(_build_password_reset_html(otp), subtype="html")

    logo = _load_brand_logo()
    if logo:
        logo_bytes, maintype, subtype, filename = logo
        message.get_payload()[-1].add_related(
            logo_bytes,
            maintype=maintype,
            subtype=subtype,
            cid="<tiffin-delight-logo>",
            filename=filename,
            disposition="inline",
        )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


def send_sms_otp(phone: str, otp: str) -> None:
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_from_number:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS OTP provider is not configured on server.",
        )

    body = urlencode(
        {
            "To": phone,
            "From": settings.twilio_from_number,
            "Body": f"Your password reset OTP is {otp}. It expires in {settings.otp_expiry_minutes} minutes.",
        }
    )

    connection = HTTPSConnection("api.twilio.com", timeout=15)
    auth = f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode("utf-8")
    encoded_auth = base64.b64encode(auth).decode("ascii")
    basic_auth = f"Basic {encoded_auth}"

    endpoint = f"/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
    connection.request(
        "POST",
        endpoint,
        body=body,
        headers={
            "Authorization": basic_auth,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    response = connection.getresponse()
    raw_response = response.read().decode("utf-8", errors="ignore")
    connection.close()

    if response.status < 200 or response.status >= 300:
        detail = "Failed to deliver SMS OTP."
        if raw_response:
            try:
                parsed = json.loads(raw_response)
                twilio_message = parsed.get("message")
                twilio_code = parsed.get("code")
                if twilio_message and twilio_code:
                    detail = f"Failed to deliver SMS OTP (Twilio {twilio_code}: {twilio_message})"
                elif twilio_message:
                    detail = f"Failed to deliver SMS OTP ({twilio_message})"
            except json.JSONDecodeError:
                pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )
