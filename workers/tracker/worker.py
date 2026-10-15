import os
import sys
import time
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "services", "api", "app"))

from supabase import create_client

from tracker import fetch_views
from payouts import detect_spike, sweep_overdue


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def snapshot_all(supa):
    subs = (
        supa.table("submissions")
        .select("id,posted_url,posted_platform")
        .in_("status", ["posted", "tracking"])
        .execute()
        .data
        or []
    )
    today = date.today().isoformat()
    for s in subs:
        if not s.get("posted_url"):
            continue
        try:
            views = fetch_views(s.get("posted_platform") or "youtube", s["posted_url"])
        except Exception:
            continue
        supa.table("view_snapshots").upsert(
            {
                "submission_id": s["id"],
                "platform": s.get("posted_platform") or "youtube",
                "views": views,
                "snapshot_date": today,
            },
            on_conflict="submission_id,platform,snapshot_date",
        ).execute()
        snaps = (
            supa.table("view_snapshots")
            .select("views")
            .eq("submission_id", s["id"])
            .order("snapshot_date")
            .execute()
            .data
            or []
        )
        if detect_spike([x["views"] for x in snaps]):
            supa.table("submissions").update({"flagged": True}).eq("id", s["id"]).execute()


def sweep(supa):
    from datetime import datetime, timezone

    apps = (
        supa.table("applications")
        .select("id,status,due_at")
        .eq("status", "accepted")
        .execute()
        .data
        or []
    )
    now = datetime.now(timezone.utc).isoformat()
    for aid in sweep_overdue(apps, now):
        supa.table("applications").update({"status": "expired"}).eq("id", aid).execute()


def main_loop():
    supa = create_client(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))
    while True:
        try:
            snapshot_all(supa)
            sweep(supa)
        except Exception:
            pass
        time.sleep(3600)


if __name__ == "__main__":
    main_loop()
