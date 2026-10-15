def aggregate_campaign(
    submissions: list[dict], snapshots: list[dict], paid_total: int
) -> dict:
    by_sub: dict[str, int] = {}
    for s in snapshots:
        by_sub[s["submission_id"]] = max(by_sub.get(s["submission_id"], 0), s["views"])
    rows = []
    for sub in submissions:
        rows.append(
            {
                "id": sub["id"],
                "status": sub["status"],
                "views": by_sub.get(sub["id"], sub.get("views_final") or 0),
            }
        )
    return {
        "clips": len(submissions),
        "posted": sum(1 for s in submissions if s["status"] in ("posted", "tracking", "paid_out")),
        "total_views": sum(r["views"] for r in rows),
        "total_paid": paid_total,
        "rows": rows,
    }


def editor_stats(submissions: list[dict], snapshots: list[dict], earned: int) -> dict:
    agg = aggregate_campaign(submissions, snapshots, earned)
    return {
        "clips_posted": agg["posted"],
        "total_views": agg["total_views"],
        "total_earned": earned,
    }
