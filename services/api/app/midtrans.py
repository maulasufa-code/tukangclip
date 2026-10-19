import base64
import hashlib
import os

import httpx


# Akun Midtrans bisa dipakai banyak platform. Prefix ini menandai order milik TukangClip.
ORDER_PREFIX = "tc-"


def _server_key() -> str:
    return os.environ.get("MIDTRANS_SERVER_KEY", "")


def _is_production() -> bool:
    return os.environ.get("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"


def _snap_base() -> str:
    return "https://app.midtrans.com" if _is_production() else "https://app.sandbox.midtrans.com"


def _api_base() -> str:
    return "https://api.midtrans.com" if _is_production() else "https://api.sandbox.midtrans.com"


def _auth_header() -> str:
    token = base64.b64encode(f"{_server_key()}:".encode()).decode()
    return f"Basic {token}"


def create_transaction(order_id: str, amount: int, title: str, payer_email: str | None = None) -> dict:
    if not _server_key():
        raise RuntimeError("midtrans-belum-dikonfigurasi")
    body = {
        "transaction_details": {"order_id": order_id, "gross_amount": amount},
        "item_details": [{"id": order_id[:50], "price": amount, "quantity": 1, "name": title[:50]}],
    }
    if payer_email:
        body["customer_details"] = {"email": payer_email}
    r = httpx.post(
        f"{_snap_base()}/snap/v1/transactions",
        json=body,
        headers={"Authorization": _auth_header(), "Accept": "application/json"},
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    return {"token": data["token"], "redirect_url": data["redirect_url"]}


def signature_ok(body: dict) -> bool:
    """Verifikasi notifikasi HTTP Midtrans: sha512(order_id + status_code + gross_amount + server_key)."""
    key = _server_key()
    if not key:
        return False
    raw = f"{body.get('order_id', '')}{body.get('status_code', '')}{body.get('gross_amount', '')}{key}"
    expected = hashlib.sha512(raw.encode()).hexdigest()
    return body.get("signature_key") == expected


def is_paid(body: dict) -> bool:
    status = body.get("transaction_status")
    if status == "settlement":
        return True
    return status == "capture" and body.get("fraud_status") == "accept"


def fetch_status(order_id: str) -> dict:
    r = httpx.get(
        f"{_api_base()}/v2/{order_id}/status",
        headers={"Authorization": _auth_header(), "Accept": "application/json"},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()
