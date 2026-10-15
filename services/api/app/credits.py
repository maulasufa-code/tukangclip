import os

from . import supabase_client as supa


def settings_map(client) -> dict:
    rows = client.table("settings").select("key,value").execute().data or []
    return {r["key"]: r["value"].get("value") for r in rows}


def balance_of(client, user_id: str) -> int:
    rows = (
        client.table("ai_credit_ledger")
        .select("amount")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    return sum(r["amount"] for r in rows)


def quote_topup(amount: int, price: int, fee_pct: int, min_amount: int) -> dict:
    if amount < min_amount:
        raise ValueError(f"minimal-topup-{min_amount}")
    fee = amount * fee_pct // 100
    credits = (amount - fee) // price
    if credits <= 0:
        raise ValueError("nominal-terlalu-kecil-untuk-1-kredit")
    return {"fee": fee, "credits": credits}
