from datetime import date, timedelta


def aggregate_campaign(
    submissions: list[dict], snapshots: list[dict], paid_total: int
) -> dict:
    # Views tertinggi per platform dulu, baru dijumlahkan: satu klip bisa tayang di beberapa platform.
    best: dict[tuple, int] = {}
    for s in snapshots:
        k = (s["submission_id"], s.get("platform"))
        best[k] = max(best.get(k, 0), s["views"])
    by_sub: dict[str, int] = {}
    for (sid, _), v in best.items():
        by_sub[sid] = by_sub.get(sid, 0) + v
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


TAYANG = ("posted", "tracking", "paid_out")
PLATFORM = ("youtube", "tiktok", "instagram")
METRIK = ("views", "likes", "comments")


def estimasi(views: int, rate_per_1000: int, cap_per_clip: int) -> int:
    """Perkiraan insentif satu klip: aturan yang sama dengan payout, tanpa sisa budget."""
    return min(max(views, 0) // 1000 * rate_per_1000, cap_per_clip)


def _links(sub: dict) -> list[dict]:
    links = sub.get("posted_links") or []
    if not links and sub.get("posted_url"):
        links = [{"platform": sub.get("posted_platform") or "youtube", "url": sub["posted_url"]}]
    return links


def build_report(
    campaigns: list[dict],
    apps: list[dict],
    subs: list[dict],
    snaps: list[dict],
    start: date,
    end: date,
) -> dict:
    """Laporan analytics: per video, per kampanye, per platform, dan deret harian.

    Angka total adalah snapshot terbaru (kumulatif). Deret harian membawa snapshot terakhir
    ke hari berikutnya, jadi hari tanpa snapshot tidak membuat grafik turun.
    """
    camp = {c["id"]: c for c in campaigns}
    camp_of_app = {a["id"]: a["campaign_id"] for a in apps}
    by_key: dict[tuple, list[dict]] = {}
    for x in snaps:
        by_key.setdefault((x["submission_id"], x["platform"]), []).append(x)
    for rows in by_key.values():
        rows.sort(key=lambda r: r["snapshot_date"])

    def pada(rows: list[dict], d: str) -> dict | None:
        hasil = None
        for r in rows:
            if r["snapshot_date"] > d:
                break
            hasil = r
        return hasil

    def jumlah(d: str) -> dict:
        out = dict.fromkeys(METRIK, 0)
        for (sid, _), rows in by_key.items():
            if sid not in aktif:
                continue
            r = pada(rows, d)
            if r:
                for m in METRIK:
                    out[m] += r.get(m) or 0
        return out

    aktif = {s["id"] for s in subs if s["status"] in TAYANG}

    videos: list[dict] = []
    for s in subs:
        if s["id"] not in aktif:
            continue
        c = camp.get(camp_of_app.get(s["application_id"]))
        if not c:
            continue
        baris = []
        for link in _links(s):
            rows = by_key.get((s["id"], link["platform"]))
            r = rows[-1] if rows else None
            baris.append(
                {
                    "submission_id": s["id"],
                    "campaign_id": c["id"],
                    "campaign_title": c.get("title", ""),
                    "platform": link["platform"],
                    "url": link["url"],
                    "status": s["status"],
                    "flagged": bool(s.get("flagged")),
                    "judul": ((s.get("posted_meta") or {}).get(link["platform"]) or {}).get("title", ""),
                    "diunggah": ((s.get("posted_meta") or {}).get(link["platform"]) or {}).get("published_at"),
                    "terbaca": r is not None,
                    **{m: (r.get(m) or 0) if r else 0 for m in METRIK},
                }
            )
        total = sum(b["views"] for b in baris)
        est = estimasi(total, c["rate_per_1000_views"], c["cap_per_clip"])
        for b in baris:
            b["estimate"] = est * b["views"] // total if total else 0
        videos.extend(baris)
    videos.sort(key=lambda v: v["views"], reverse=True)

    def kelompok(kunci: str, awal: list[dict] | None = None) -> list[dict]:
        grup: dict[str, dict] = {x["id"]: x for x in (awal or [])}
        for v in videos:
            g = grup.setdefault(v[kunci], {"id": v[kunci], "videos": 0, "estimate": 0, **dict.fromkeys(METRIK, 0)})
            g["videos"] += 1
            g["estimate"] += v["estimate"]
            for m in METRIK:
                g[m] += v[m]
        return list(grup.values())

    kampanye = kelompok(
        "campaign_id",
        [
            {
                "id": c["id"],
                "title": c.get("title", ""),
                "rate": c["rate_per_1000_views"],
                "budget_total": c.get("budget_total", 0),
                "budget_remaining": c.get("budget_remaining", 0),
                "videos": 0,
                "estimate": 0,
                **dict.fromkeys(METRIK, 0),
            }
            for c in campaigns
        ],
    )
    # Ketiga platform selalu ada di laporan, meski belum ada klip di sana.
    platform = sorted(
        kelompok(
            "platform",
            [{"id": p, "videos": 0, "estimate": 0, **dict.fromkeys(METRIK, 0)} for p in PLATFORM],
        ),
        key=lambda g: g["views"],
        reverse=True,
    )
    for g in platform:
        g["platform"] = g.pop("id")

    hari = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    deret = [{"date": d.isoformat(), **jumlah(d.isoformat())} for d in hari]
    awal = jumlah((start - timedelta(days=1)).isoformat())
    return {
        "days": len(hari),
        "from": start.isoformat(),
        "to": end.isoformat(),
        "totals": {
            "videos": len(videos),
            **{m: sum(v[m] for v in videos) for m in METRIK},
            "estimate": sum(v["estimate"] for v in videos),
            "views_gain": deret[-1]["views"] - awal["views"],
        },
        "campaigns": kampanye,
        "platforms": platform,
        "videos": videos,
        "series": deret,
    }


def papan_peringkat(
    apps: list[dict],
    subs: list[dict],
    snaps: list[dict],
    nama: dict[str, str],
    saya: str,
    batas: int = 10,
) -> dict:
    """Papan peringkat clipper. Poin = 1 per 1.000 views dari semua klip yang sudah tayang.

    Views tiap platform diambil dari snapshot tertinggi, lalu dijumlahkan per klip, dan per clipper.
    Hanya klip yang sudah tayang (TAYANG) yang dihitung.
    """
    editor_of = {a["id"]: a["editor_id"] for a in apps}
    best: dict[tuple, int] = {}
    for x in snaps:
        k = (x["submission_id"], x.get("platform"))
        best[k] = max(best.get(k, 0), x.get("views") or 0)

    per: dict[str, dict] = {}
    for s in subs:
        if s["status"] not in TAYANG:
            continue
        editor = editor_of.get(s["application_id"])
        if not editor:
            continue
        views = sum(v for (sid, _), v in best.items() if sid == s["id"])
        row = per.setdefault(editor, {"clips": 0, "views": 0})
        row["clips"] += 1
        row["views"] += views

    urut = sorted(per.items(), key=lambda kv: kv[1]["views"], reverse=True)
    papan = []
    posisi_saya = None
    for i, (editor, row) in enumerate(urut, start=1):
        item = {
            "rank": i,
            "nama": nama.get(editor) or "Clipper",
            "clips": row["clips"],
            "views": row["views"],
            # Aturan poin: 1 poin per 1.000 views.
            "poin": row["views"] // 1000,
            "saya": editor == saya,
        }
        if i <= batas:
            papan.append(item)
        if editor == saya:
            posisi_saya = item
    return {"papan": papan, "saya": posisi_saya, "jumlah": len(urut)}


def editor_stats(submissions: list[dict], snapshots: list[dict], earned: int) -> dict:
    agg = aggregate_campaign(submissions, snapshots, earned)
    return {
        "clips_posted": agg["posted"],
        "total_views": agg["total_views"],
        "total_earned": earned,
    }
