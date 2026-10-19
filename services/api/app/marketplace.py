from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from . import supabase_client as supa
from .authz import require_role, require_user
from .schemas import CampaignCreate, Decision, LinksUpdate, Review, SubmissionCreate

router = APIRouter()

# Harus sama dengan MINIMAL_RATE di apps/web/lib/harga.ts.
MINIMAL_RATE = 1_000
# Batas lamaran aktif (menunggu atau diterima) per clipper, sama dengan yang dijanjikan di UI.
MAKS_PROYEK_AKTIF = 3


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
    if body.budgetTotal <= 0 or body.capPerClip <= 0:
        raise HTTPException(status_code=400, detail="budget-cap-harus-positif")
    if body.ratePer1000 < MINIMAL_RATE:
        raise HTTPException(status_code=400, detail="rate-di-bawah-minimal")
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


# Kolom yang boleh dilihat tanpa login di halaman jelajah.
PUBLIC_CAMPAIGN_FIELDS = (
    "id",
    "title",
    "brief",
    "budget_total",
    "budget_remaining",
    "rate_per_1000_views",
    "cap_per_clip",
    "deadline_at",
    "created_at",
    "status",
)


@router.get("/campaigns")
def list_campaigns():
    client = supa.service_client()
    rows = client.table("campaigns").select("*").eq("status", "open").execute().data or []
    return {"items": [{k: r.get(k) for k in PUBLIC_CAMPAIGN_FIELDS} for r in rows]}


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
    else:
        nama = {}
        for eid in {a["editor_id"] for a in apps}:
            row = client.table("profiles").select("display_name").eq("id", eid).execute().data or []
            nama[eid] = (row[0].get("display_name") if row else "") or ""
        apps = [{**a, "editor_name": nama.get(a["editor_id"], "")} for a in apps]
    return {**c, "applications": apps}


@router.post("/campaigns/{cid}/apply")
def apply(cid: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    require_role(client, user_id, ["editor", "admin"])
    c = campaign_or_404(client, cid)
    if c["status"] != "open":
        raise HTTPException(status_code=400, detail="kampanye-tidak-buka")
    milik = client.table("applications").select("*").eq("editor_id", user_id).execute().data or []
    aktif = [a for a in milik if a.get("status") in ("applied", "accepted")]
    if len(aktif) >= MAKS_PROYEK_AKTIF:
        raise HTTPException(status_code=409, detail="batas-proyek-aktif")
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


def _cek_tautan(client, raw: list, kecuali_sid: str | None = None) -> list[dict]:
    """Satu klip = satu set tautan, satu tautan per platform. Tautan tidak boleh dipakai dua kali."""
    links = [{"platform": l.platform, "url": l.url.strip()} for l in raw]
    if any(not l["url"].startswith(("https://", "http://")) for l in links):
        raise HTTPException(status_code=400, detail="tautan-tidak-valid")
    if len({l["platform"] for l in links}) != len(links):
        raise HTTPException(status_code=400, detail="platform-ganda")
    if len({l["url"] for l in links}) != len(links):
        raise HTTPException(status_code=400, detail="tautan-sudah-dipakai")
    # ponytail: cek tautan dengan memindai semua submission, ganti index jsonb kalau sudah ribuan.
    semua = client.table("submissions").select("id,posted_links").execute().data or []
    pakai = {x["url"] for row in semua if row["id"] != kecuali_sid for x in row.get("posted_links") or []}
    if pakai & {l["url"] for l in links}:
        raise HTTPException(status_code=409, detail="tautan-sudah-dipakai")
    return links


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
    links = _cek_tautan(client, body.links)
    try:
        saved = (
            client.table("submissions")
            .insert(
                {
                    "application_id": body.applicationId,
                    "status": "submitted",
                    "posted_url": links[0]["url"],
                    "posted_platform": links[0]["platform"],
                    "posted_links": links,
                    "posted_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
            .data
        )
    except Exception:
        raise HTTPException(status_code=409, detail="sudah-kirim")
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
    note = body.note.strip()
    if body.decision != "approve" and not note:
        raise HTTPException(status_code=400, detail="alasan-wajib")
    # Setujui: tautan sudah berisi postingan, jadi langsung mulai dilacak. Revisi: klipper kirim ulang.
    status, note = {
        "approve": ("posted", ""),
        "revision": ("draft", note),
        "decline": ("rejected", note),
    }[body.decision]
    client.table("submissions").update({"status": status, "review_note": note}).eq("id", sid).execute()
    return {"ok": True, "status": status}


@router.delete("/submissions/{sid}")
def delete_submission(sid: str, authorization: str | None = Header(default=None)):
    """Klipper menghapus klip yang belum disetujui. Klip yang sudah diputuskan tidak bisa dihapus."""
    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    if not a or a["editor_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-pihakmu")
    if s["status"] not in ("draft", "submitted"):
        raise HTTPException(status_code=400, detail="sudah-diputuskan")
    client.table("submissions").delete().eq("id", sid).execute()
    return {"ok": True}


@router.post("/submissions/{sid}/links")
def resubmit(sid: str, body: LinksUpdate, authorization: str | None = Header(default=None)):
    """Klipper mengubah tautan klip yang belum diputuskan, atau mengirim ulang setelah diminta revisi."""
    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    if not a or a["editor_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-pihakmu")
    if s["status"] not in ("draft", "submitted"):
        raise HTTPException(status_code=400, detail="sudah-diputuskan")
    links = _cek_tautan(client, body.links, kecuali_sid=sid)
    client.table("submissions").update(
        {
            "status": "submitted",
            "review_note": "",
            "posted_url": links[0]["url"],
            "posted_platform": links[0]["platform"],
            "posted_links": links,
            "posted_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", sid).execute()
    return {"ok": True, "status": "submitted"}


@router.get("/submissions/{sid}/file")
def submission_file(sid: str, authorization: str | None = Header(default=None)):
    from . import r2 as r2mod

    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    c = campaign_or_404(client, a["campaign_id"])
    if user_id not in (a["editor_id"], c["creator_id"]):
        raise HTTPException(status_code=403, detail="bukan-pihakmu")
    if not s.get("file_r2_key"):
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    return {"url": r2mod.presigned_get(s["file_r2_key"], 600)}


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


class Fund(BaseModel):
    amount: int


class Dispute(BaseModel):
    note: str = ""


class Resolve(BaseModel):
    clear: bool


@router.post("/campaigns/{cid}/fund")
def fund(cid: str, body: Fund, authorization: str | None = Header(default=None)):
    import uuid

    from . import midtrans as midtransmod
    from .credits import settings_map

    user_id = require_user(authorization)
    client = supa.service_client()
    c = campaign_or_404(client, cid)
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    s = settings_map(client)
    minimal = int(s.get("min_campaign_topup_idr", 3_000_000))
    if body.amount < minimal:
        raise HTTPException(status_code=400, detail=f"minimal-topup-{minimal}")
    # Biaya platform dibayar di atas budget, jadi seluruh body.amount masuk escrow.
    # Webhook mengkredit escrow sebesar amount - fee.
    fee = body.amount * int(s.get("campaign_fee_pct", 15)) // 100
    total = body.amount + fee
    idem = str(uuid.uuid4())
    order_id = f"{midtransmod.ORDER_PREFIX}fund-{idem}"
    saved = (
        client.table("topup_intents")
        .insert(
            {
                "user_id": user_id,
                "campaign_id": cid,
                "amount": total,
                "fee": fee,
                "credits": 0,
                "idempotency_key": idem,
                "gateway_ref": order_id,
            }
        )
        .execute()
        .data
    )
    if not saved:
        raise HTTPException(status_code=500, detail="gagal-buat-fund")
    try:
        tx = midtransmod.create_transaction(order_id, total, f"Danai kampanye {c['title'][:30]}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)[:100])
    return {"snapToken": tx["token"], "payUrl": tx["redirect_url"], "fee": fee, "total": total}


@router.post("/submissions/{sid}/dispute")
def dispute(sid: str, body: Dispute, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    c = campaign_or_404(client, a["campaign_id"])
    if user_id not in (a["editor_id"], c["creator_id"]):
        raise HTTPException(status_code=403, detail="bukan-pihakmu")
    client.table("submissions").update(
        {"flagged": True, "dispute": body.note[:500]}
    ).eq("id", sid).execute()
    return {"ok": True, "flagged": True}


@router.post("/submissions/{sid}/dispute/resolve")
def resolve(sid: str, body: Resolve, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    c = campaign_or_404(client, a["campaign_id"])
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    patch = {"flagged": not body.clear, "dispute": "" if body.clear else s.get("dispute", "")}
    client.table("submissions").update(patch).eq("id", sid).execute()
    return {"ok": True, "flagged": patch["flagged"]}


@router.post("/submissions/{sid}/payout")
def payout(sid: str, authorization: str | None = Header(default=None)):
    import uuid
    from datetime import datetime, timezone

    from . import xendit as xenditmod
    from .credits import settings_map
    from .payouts import compute_payout, ledger_pair, total_per_date

    user_id = require_user(authorization)
    client = supa.service_client()
    s = client.table("submissions").select("*").eq("id", sid).single().execute().data
    if not s:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    a = client.table("applications").select("*").eq("id", s["application_id"]).single().execute().data
    c = campaign_or_404(client, a["campaign_id"])
    if c["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="bukan-kampanyemu")
    if s["status"] not in ("posted", "tracking"):
        raise HTTPException(status_code=400, detail="belum-tayang")
    if s.get("flagged"):
        raise HTTPException(status_code=400, detail="tersangkut-sengketa")
    from .authz import has_verified_mfa

    if not has_verified_mfa(a["editor_id"]):
        raise HTTPException(status_code=403, detail="editor-wajib-2fa")
    sm = settings_map(client)
    hold = int(sm.get("view_hold_days", 7))
    posted_at = datetime.fromisoformat(s["posted_at"])
    if datetime.now(timezone.utc) < posted_at + timedelta(days=hold):
        raise HTTPException(status_code=400, detail="masa-tahan-belum-lewat")
    snaps = (
        client.table("view_snapshots")
        .select("views,snapshot_date")
        .eq("submission_id", sid)
        .execute()
        .data
        or []
    )
    series = total_per_date(snaps)
    final_views = max(series) if series else 0
    amount = compute_payout(
        s.get("views_final") or final_views,
        c["rate_per_1000_views"],
        c["cap_per_clip"],
        c["budget_remaining"],
    )
    if amount <= 0:
        raise HTTPException(status_code=400, detail="insentif-nol")
    group = str(uuid.uuid4())
    idem = str(uuid.uuid4())
    for leg in ledger_pair(group, c["id"], a["editor_id"], sid, amount, idem):
        done = client.table("money_ledger").insert(leg).execute().data
        if not done:
            raise HTTPException(status_code=409, detail="sudah-dibayar")
    acct = (
        client.table("payout_accounts")
        .select("*")
        .eq("user_id", a["editor_id"])
        .eq("is_verified", True)
        .execute()
        .data
    )
    if not acct:
        raise HTTPException(status_code=400, detail="rekening-editor-belum-verifikasi")
    from . import crypto as cryptomod

    try:
        account_number = cryptomod.decrypt(acct[0]["account_ref"])
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    try:
        disb = xenditmod.create_disbursement(
            amount, acct[0]["provider"], account_number, acct[0]["account_name"], f"pay:{idem}"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)[:100])
    client.table("payouts").insert(
        {
            "editor_id": a["editor_id"],
            "submission_id": sid,
            "amount": amount,
            "xendit_id": disb["id"],
            "status": "processing",
            "idempotency_key": idem,
        }
    ).execute()
    client.table("submissions").update({"status": "paid_out"}).eq("id", sid).execute()
    client.table("campaigns").update(
        {"budget_remaining": c["budget_remaining"] - amount}
    ).eq("id", c["id"]).execute()
    return {"ok": True, "amount": amount}
