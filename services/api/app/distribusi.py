from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from . import social as socialmod
from . import supabase_client as supa
from .analytics import aggregate_campaign, build_report, editor_stats
from .authz import require_user

router = APIRouter()


class Publish(BaseModel):
    platform: str = "youtube"


def account_or_404(client, user_id: str, platform: str) -> dict:
    acc = (
        client.table("social_accounts")
        .select("*")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .single()
        .execute()
        .data
    )
    if not acc:
        raise HTTPException(status_code=400, detail="akun-belum-disambung")
    return acc


def fresh_token(client, acc: dict) -> str:
    if acc.get("expires_at"):
        exp = datetime.fromisoformat(acc["expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp > datetime.now(timezone.utc) + timedelta(minutes=5):
            return acc["access_token"]
    if not acc.get("refresh_token"):
        raise HTTPException(status_code=400, detail="token-kedaluarsa-hubungkan-ulang")
    data = socialmod.refresh_token(acc["refresh_token"])
    client.table("social_accounts").update(
        {
            "access_token": data["access_token"],
            "expires_at": (
                datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
            ).isoformat(),
        }
    ).eq("id", acc["id"]).execute()
    return data["access_token"]


@router.get("/oauth/{platform}/url")
def oauth_url(platform: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    if platform == "youtube":
        return {"url": socialmod.youtube_auth_url(user_id)}
    raise HTTPException(status_code=501, detail="tiktok-menunggu-verifikasi-docs")


@router.get("/oauth/youtube/callback")
def oauth_callback(code: str = "", state: str = ""):
    client = supa.service_client()
    try:
        data = socialmod.exchange_code(code)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)[:100])
    expires = None
    if data.get("expires_in"):
        expires = (
            datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])
        ).isoformat()
    existing = (
        client.table("social_accounts")
        .select("id")
        .eq("user_id", state)
        .eq("platform", "youtube")
        .single()
        .execute()
        .data
    )
    row = {
        "user_id": state,
        "platform": "youtube",
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token"),
        "expires_at": expires,
    }
    if existing:
        client.table("social_accounts").update(row).eq("id", existing["id"]).execute()
    else:
        client.table("social_accounts").insert(row).execute()
    return RedirectResponse(url="/akun?tersambung=youtube")


@router.get("/social")
def my_social(authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    rows = (
        client.table("social_accounts")
        .select("platform,account_name,created_at")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    return {"items": rows}


@router.post("/submissions/{sid}/publish")
def publish(sid: str, body: Publish, authorization: str | None = Header(default=None)):
    import boto3
    import os

    user_id = require_user(authorization)
    if body.platform != "youtube":
        raise HTTPException(status_code=501, detail="tiktok-menunggu-verifikasi-docs")
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    from .marketplace import campaign_or_404

    c = campaign_or_404(client, a["campaign_id"])
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    if s["status"] != "approved":
        raise HTTPException(status_code=400, detail="belum-disetujui")
    acc = account_or_404(client, user_id, "youtube")
    token = fresh_token(client, acc)
    s3 = boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("R2_SECRET_ACCESS_KEY"),
    )
    obj = s3.get_object(Bucket=os.environ.get("R2_BUCKET_RAW"), Key=s["file_r2_key"])
    video = obj["Body"].read()
    try:
        url = socialmod.youtube_upload(token, f"Klip {c['title']}"[:100], c.get("brief", ""), video)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)[:150])
    client.table("submissions").update(
        {
            "status": "posted",
            "posted_url": url,
            "posted_platform": "youtube",
            "posted_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", sid).execute()
    return {"ok": True, "url": url}


@router.get("/campaigns/{cid}/analytics")
def campaign_analytics(cid: str, authorization: str | None = Header(default=None)):
    from .marketplace import campaign_or_404

    user_id = require_user(authorization)
    client = supa.service_client()
    c = campaign_or_404(client, cid)
    apps = client.table("applications").select("id,editor_id").eq("campaign_id", cid).execute().data or []
    if c["creator_id"] != user_id and not any(a["editor_id"] == user_id for a in apps):
        raise HTTPException(status_code=403, detail="bukan-pihakmu")
    subs = []
    for a in apps:
        subs.extend(
            client.table("submissions").select("*").eq("application_id", a["id"]).execute().data or []
        )
    snaps = []
    for s in subs:
        snaps.extend(
            client.table("view_snapshots").select("submission_id,views").eq("submission_id", s["id"]).execute().data or []
        )
    legs = (
        client.table("money_ledger")
        .select("credit")
        .eq("campaign_id", cid)
        .execute()
        .data
        or []
    )
    paid = sum(x.get("credit", 0) for x in legs if str(x.get("account", "")).startswith("payable:"))
    return aggregate_campaign(subs, snaps, paid)


@router.get("/analytics")
def analytics(
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = None,
    campaign_id: str | None = None,
    authorization: str | None = Header(default=None),
):
    """Analytics semua video milik user: kreator melihat kampanyenya, clipper melihat kerjanya.

    Rentang tanggal lewat `from` dan `to` (YYYY-MM-DD, batas inklusif). Default 30 hari terakhir.
    """
    user_id = require_user(authorization)
    client = supa.service_client()
    try:
        akhir = date.fromisoformat(to) if to else date.today()
        awal = date.fromisoformat(from_) if from_ else akhir - timedelta(days=29)
    except ValueError:
        raise HTTPException(status_code=400, detail="tanggal-tidak-valid")
    if awal > akhir:
        raise HTTPException(status_code=400, detail="rentang-terbalik")
    if (akhir - awal).days > 364:
        raise HTTPException(status_code=400, detail="rentang-terlalu-lebar")

    campaigns = client.table("campaigns").select("*").eq("creator_id", user_id).execute().data or []
    peran = "creator"
    if campaigns:
        apps = []
        for c in campaigns:
            apps.extend(client.table("applications").select("*").eq("campaign_id", c["id"]).execute().data or [])
    else:
        peran = "editor"
        apps = client.table("applications").select("*").eq("editor_id", user_id).execute().data or []
        for cid in dict.fromkeys(a["campaign_id"] for a in apps):
            campaigns.extend(client.table("campaigns").select("*").eq("id", cid).execute().data or [])

    pilihan = [{"id": c["id"], "title": c.get("title", "")} for c in campaigns]
    if campaign_id:
        campaigns = [c for c in campaigns if c["id"] == campaign_id]
        apps = [a for a in apps if a["campaign_id"] == campaign_id]

    subs = []
    for a in apps:
        subs.extend(client.table("submissions").select("*").eq("application_id", a["id"]).execute().data or [])
    snaps = []
    for s in subs:
        snaps.extend(client.table("view_snapshots").select("*").eq("submission_id", s["id"]).execute().data or [])
    # ponytail: satu query per lamaran dan per klip, ganti ke satu query .in_() kalau datanya ratusan.
    return {
        **build_report(campaigns, apps, subs, snaps, awal, akhir),
        "peran": peran,
        "pilihan_kampanye": pilihan,
    }


@router.get("/leaderboard")
def leaderboard(authorization: str | None = Header(default=None)):
    """Papan peringkat clipper berdasarkan views klip tayang. Nama yang tampil adalah display_name."""
    from .analytics import papan_peringkat

    user_id = require_user(authorization)
    client = supa.service_client()
    apps = client.table("applications").select("id,editor_id").execute().data or []
    subs = client.table("submissions").select("id,application_id,status").execute().data or []
    snaps = client.table("view_snapshots").select("submission_id,platform,views").execute().data or []
    editor_ids = {a["editor_id"] for a in apps}
    nama = {}
    if editor_ids:
        for p in client.table("profiles").select("id,display_name").execute().data or []:
            if p["id"] in editor_ids:
                nama[p["id"]] = p.get("display_name") or ""
    # ponytail: memindai semua baris di sini. Kalau clipper sudah ribuan, hitung di SQL (view agregat).
    return papan_peringkat(apps, subs, snaps, nama, saya=user_id)


@router.get("/me/stats")
def my_stats(authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    apps = client.table("applications").select("id").eq("editor_id", user_id).execute().data or []
    subs = []
    for a in apps:
        subs.extend(
            client.table("submissions").select("*").eq("application_id", a["id"]).execute().data or []
        )
    snaps = []
    for s in subs:
        snaps.extend(
            client.table("view_snapshots").select("submission_id,views").eq("submission_id", s["id"]).execute().data or []
        )
    pays = client.table("payouts").select("amount").eq("editor_id", user_id).execute().data or []
    earned = sum(p.get("amount", 0) for p in pays if p)
    return editor_stats(subs, snaps, earned)
