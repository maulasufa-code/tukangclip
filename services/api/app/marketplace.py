from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException

from . import supabase_client as supa
from .authz import require_role, require_user
from .schemas import CampaignCreate, Decision, Posted, Review, SubmissionCreate

router = APIRouter()


def campaign_or_404(client, cid: str) -> dict:
    c = client.table("campaigns").select("*").eq("id", cid).single().execute().data
    if not c:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    return c


@router.post("/campaigns")
def create_campaign(body: CampaignCreate, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    require_role(client, user_id, ["creator", "admin"])
    if body.budgetTotal <= 0 or body.ratePer1000 <= 0 or body.capPerClip <= 0:
        raise HTTPException(status_code=400, detail="budget-rate-cap-harus-positif")
    if len(body.title) < 4:
        raise HTTPException(status_code=400, detail="judul-terlalu-pendek")
    row = {
        "creator_id": user_id,
        "title": body.title,
        "brief": body.brief,
        "source_url": body.sourceUrl,
        "source_r2_key": body.sourceR2Key,
        "budget_total": body.budgetTotal,
        "budget_remaining": body.budgetTotal,
        "rate_per_1000_views": body.ratePer1000,
        "cap_per_clip": body.capPerClip,
        "deadline_at": body.deadlineAt,
        "status": "open",
        "escrow": "locked",
    }
    saved = client.table("campaigns").insert(row).execute().data
    if not saved:
        raise HTTPException(status_code=500, detail="gagal-buat-kampanye")
    return saved[0]


@router.get("/campaigns")
def list_campaigns(authorization: str | None = Header(default=None)):
    require_user(authorization)
    client = supa.service_client()
    rows = client.table("campaigns").select("*").eq("status", "open").execute().data or []
    return {"items": rows}


@router.get("/campaigns/{cid}")
def get_campaign(cid: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    c = campaign_or_404(client, cid)
    if c["status"] != "open" and c["creator_id"] != user_id:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    apps = client.table("applications").select("*").eq("campaign_id", cid).execute().data or []
    if c["creator_id"] != user_id:
        apps = [a for a in apps if a["editor_id"] == user_id]
    return {**c, "applications": apps}


@router.post("/campaigns/{cid}/apply")
def apply(cid: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    require_role(client, user_id, ["editor", "admin"])
    c = campaign_or_404(client, cid)
    if c["status"] != "open":
        raise HTTPException(status_code=400, detail="kampanye-tidak-buka")
    try:
        saved = (
            client.table("applications")
            .insert({"campaign_id": cid, "editor_id": user_id})
            .execute()
            .data
        )
    except Exception:
        raise HTTPException(status_code=409, detail="sudah-melamar")
    if not saved:
        raise HTTPException(status_code=409, detail="sudah-melamar")
    return saved[0]


@router.post("/applications/{aid}/decision")
def decide(aid: str, body: Decision, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    a = client.table("applications").select("*").eq("id", aid).single().execute().data
    if not a:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    c = campaign_or_404(client, a["campaign_id"])
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    if body.accept:
        now = datetime.now(timezone.utc)
        patch = {
            "status": "accepted",
            "accepted_at": now.isoformat(),
            "due_at": (now + timedelta(hours=72)).isoformat(),
        }
    else:
        patch = {"status": "rejected"}
    client.table("applications").update(patch).eq("id", aid).execute()
    return {"ok": True, "status": patch["status"]}


@router.post("/submissions")
def submit(body: SubmissionCreate, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    a = (
        client.table("applications")
        .select("*")
        .eq("id", body.applicationId)
        .single()
        .execute()
        .data
    )
    if not a or a["editor_id"] != user_id:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    if a["status"] != "accepted":
        raise HTTPException(status_code=400, detail="lamaran-belum-diterima")
    saved = (
        client.table("submissions")
        .insert(
            {"application_id": body.applicationId, "file_r2_key": body.fileR2Key, "status": "submitted"}
        )
        .execute()
        .data
    )
    if not saved:
        raise HTTPException(status_code=500, detail="gagal-kirim")
    return saved[0]


@router.post("/submissions/{sid}/review")
def review(sid: str, body: Review, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    c = campaign_or_404(client, a["campaign_id"])
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    if s["status"] != "submitted":
        raise HTTPException(status_code=400, detail="bukan-status-submitted")
    status = "approved" if body.approve else "rejected"
    client.table("submissions").update({"status": status}).eq("id", sid).execute()
    return {"ok": True, "status": status}


@router.post("/submissions/{sid}/posted")
def mark_posted(sid: str, body: Posted, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    c = campaign_or_404(client, a["campaign_id"])
    if user_id not in (a["editor_id"], c["creator_id"]):
        raise HTTPException(status_code=403, detail="bukan-pihakmu")
    if s["status"] != "approved":
        raise HTTPException(status_code=400, detail="belum-disetujui")
    client.table("submissions").update(
        {
            "status": "posted",
            "posted_url": body.url,
            "posted_platform": body.platform,
            "posted_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", sid).execute()
    return {"ok": True, "status": "posted"}


@router.get("/campaigns/{cid}/submissions")
def campaign_submissions(cid: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    c = campaign_or_404(client, cid)
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    apps = client.table("applications").select("id").eq("campaign_id", cid).execute().data or []
    ids = [a["id"] for a in apps]
    items = []
    for aid in ids:
        rows = client.table("submissions").select("*").eq("application_id", aid).execute().data or []
        items.extend(rows)
    return {"items": items}


@router.get("/me/applications")
def my_applications(authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    rows = client.table("applications").select("*").eq("editor_id", user_id).execute().data or []
    return {"items": rows}
