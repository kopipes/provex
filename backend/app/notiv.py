"""Client for sending notifications through Notiv.

Design notes (see Notiv universal integration guide):
- Messages are delivered over HTTPS into the Notiv inbox; email is only the
  account identifier, not an SMTP destination.
- NOTIV_API_KEY is the only required secret and is read from the environment.
  When it is absent the channel is disabled and callers continue normally.
- Sending runs in a background task so a Notiv outage can never roll back or
  fail the user-facing request (e.g. a password reset).
"""

import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

DEFAULT_NOTIV_URL = "https://notiv.provaliantgroup.com"
REQUEST_TIMEOUT_SECONDS = 15.0


def notiv_enabled() -> bool:
    return bool(os.getenv("NOTIV_API_KEY"))


def _notiv_url() -> str:
    return (os.getenv("NOTIV_URL") or DEFAULT_NOTIV_URL).rstrip("/")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('NOTIV_API_KEY', '')}",
        "Content-Type": "application/json",
    }


def get_integration_info() -> Optional[dict]:
    """Return the integration identity for the configured key (setup check)."""
    if not notiv_enabled():
        return None
    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = client.get(f"{_notiv_url()}/api/v1/integration", headers=_headers())
        if response.status_code != 200:
            return None
        return response.json().get("integration")
    except Exception as exc:  # network / parsing problems must not propagate
        logger.warning("Notiv integration check failed: %s", exc)
        return None


def check_recipients(emails: list[str]) -> dict[str, bool]:
    """Point-in-time readiness check (max 100 addresses per batch)."""
    if not notiv_enabled() or not emails:
        return {}
    result: dict[str, bool] = {}
    for start in range(0, len(emails), 100):
        batch = emails[start:start + 100]
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = client.post(
                    f"{_notiv_url()}/api/v1/recipients/check",
                    headers=_headers(),
                    json={"emails": batch},
                )
            if response.status_code != 200:
                logger.warning("Notiv recipient check HTTP %s", response.status_code)
                continue
            for item in response.json().get("recipients", []):
                result[item["email"].lower()] = bool(item.get("deliverable"))
        except Exception as exc:
            logger.warning("Notiv recipient check failed: %s", exc)
    return result


def send_notification(
    recipient_email: str,
    title: str,
    message: str,
    event_id: Optional[str] = None,
    action_url: Optional[str] = None,
    notification_type: Optional[str] = None,
) -> dict:
    """Send one notification. Returns a status dict; never raises.

    Retries with the same `event_id` are safe: Notiv treats a repeated
    idempotency_key with identical content as already stored.
    """
    if not notiv_enabled():
        return {"ok": False, "status": "disabled"}

    payload = {
        "recipient_email": recipient_email,
        "title": title[:200],
        "message": message[:5000],
    }
    if event_id:
        payload["idempotency_key"] = event_id[:200]
    if action_url:
        payload["action_url"] = action_url
    if notification_type:
        payload["type"] = notification_type[:60]

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = client.post(
                f"{_notiv_url()}/api/v1/notifications",
                headers=_headers(),
                json=payload,
            )
        body: dict = {}
        try:
            body = response.json()
        except Exception:
            body = {}

        if response.status_code in (200, 202):
            return {
                "ok": True,
                "status": body.get("status", "stored"),
                "id": body.get("id"),
                "request_id": body.get("request_id"),
                "duplicate": body.get("duplicate", False),
            }

        logger.warning(
            "Notiv send failed: HTTP %s request_id=%s",
            response.status_code,
            body.get("request_id"),
        )
        return {
            "ok": False,
            "status": response.status_code,
            "request_id": body.get("request_id"),
        }
    except Exception as exc:
        logger.warning("Notiv send error: %s", exc)
        return {"ok": False, "status": "error", "error": str(exc)}
