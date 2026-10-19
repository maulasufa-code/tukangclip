import os
import sys
import time
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "services", "api", "app"))

from supabase import create_client

from tracker import fetch_stats
from payouts import detect_spike, sweep_overdue, total_per_date


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def snapshot_all(supa):
    subs = (
        supa.table("submissions")
        .select("id,posted_url,posted_platform,posted_links,posted_meta")
        .in_("status", ["posted", "tracking"])
        .execute()
        .data
        or []
    )
    today = date.today().isoformat()
    for s in subs:
        links = s.get("posted_links") or []
        if not links and s.get("posted_url"):
            links = [{"platform": s.get("posted_platform") or "youtube", "url": s["posted_url"]}]
        meta = dict(s.get("posted_meta") or {})
        for l in links:
            try:
                stats = fetch_stats(l["platform"], l["url"])
            except Exception:
                continue
            supa.table("view_snapshots").upsert(
                {
                    "submission_id": s["id"],
                    "platform": l["platform"],
                    "views": stats["views"],
                    "likes": stats["likes"],
                    "comments": stats["comments"],
                    "snapshot_date": today,
                },
                on_conflict="submission_id,platform,snapshot_date",
            ).execute()
            # Judul dan tanggal unggah hanya diisi sekali, lalu dipakai untuk tampilan.
            if stats.get("title") and l["platform"] not in meta:
                meta[l["platform"]] = {"title": stats["title"], "published_at": stats.get("published_at")}
        if meta != (s.get("posted_meta") or {}):
            supa.table("submissions").update({"posted_meta": meta}).eq("id", s["id"]).execute()
        snaps = (
            supa.table("view_snapshots")
            .select("views,snapshot_date")
            .eq("submission_id", s["id"])
            .execute()
            .data
            or []
        )
        if detect_spike(total_per_date(snaps)):
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
