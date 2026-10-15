import os

import httpx

BASE = "https://api.xendit.co"


def _secret() -> str:
    return os.environ.get("XENDIT_SECRET_KEY", "")


def callback_ok(token: str) -> bool:
    expected = os.environ.get("XENDIT_CALLBACK_TOKEN", "")
    return bool(expected) and token == expected


def create_invoice(amount: int, external_id: str, payer_email: str | None = None) -> dict:
    if not _secret():
        raise RuntimeError("xendit-belum-dikonfigurasi")
    body = {
        "external_id": external_id,
        "amount": amount,
        "currency": "IDR",
        "description": "Top-up kredit TukangClip",
    }
    if payer_email:
        body["payer_email"] = payer_email
    r = httpx.post(
        f"{BASE}/v2/invoices",
        json=body,
        auth=(_secret(), ""),
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    return {"id": data["id"], "url": data["invoice_url"]}


def create_disbursement(
    amount: int, bank_code: str, account_number: str, account_name: str, external_id: str
) -> dict:
    if not _secret():
        raise RuntimeError("xendit-belum-dikonfigurasi")
    r = httpx.post(
        f"{BASE}/v2/disbursements",
        json={
            "external_id": external_id,
            "bank_code": bank_code,
            "account_holder_name": account_name,
            "account_number": account_number,
            "description": "Insentif klip TukangClip",
            "amount": amount,
        },
        auth=(_secret(), ""),
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    return {"id": data["id"], "status": data.get("status", "PENDING")}
