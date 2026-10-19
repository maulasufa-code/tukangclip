from statistics import median


def compute_payout(views_final: int, rate_per_1000: int, cap_per_clip: int, budget_remaining: int) -> int:
    gross = max(views_final, 0) // 1000 * rate_per_1000
    return min(gross, cap_per_clip, budget_remaining)


def total_per_date(snaps: list[dict]) -> list[int]:
    """Total views semua platform per tanggal, diurutkan menurut tanggal."""
    per: dict[str, int] = {}
    for x in snaps:
        per[x["snapshot_date"]] = per.get(x["snapshot_date"], 0) + x["views"]
    return [per[d] for d in sorted(per)]


def detect_spike(daily_views: list[int], multiplier: int = 10, min_views: int = 1000) -> bool:
    if len(daily_views) < 4:
        return False
    *prev, last = daily_views
    growths = [b - a for a, b in zip(prev, prev[1:]) if b > a]
    base = median(growths) if growths else 0
    last_growth = last - prev[-1]
    return last_growth >= min_views and (base <= 0 or last_growth >= multiplier * base)


def sweep_overdue(applications: list[dict], now_iso: str) -> list[str]:
    return [
        a["id"]
        for a in applications
        if a.get("status") == "accepted" and a.get("due_at") and a["due_at"] < now_iso
    ]


def ledger_pair(
    group_id: str,
    campaign_id: str,
    editor_id: str,
    submission_id: str,
    amount: int,
    idem: str,
) -> list[dict]:
    return [
        {
            "group_id": group_id,
            "account": f"escrow:{campaign_id}",
            "user_id": None,
            "campaign_id": campaign_id,
            "submission_id": submission_id,
            "debit": amount,
            "credit": 0,
            "idempotency_key": f"{idem}:debit",
        },
        {
            "group_id": group_id,
            "account": f"payable:{editor_id}",
            "user_id": editor_id,
            "campaign_id": campaign_id,
            "submission_id": submission_id,
            "debit": 0,
            "credit": amount,
            "idempotency_key": f"{idem}:credit",
        },
    ]
