from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel
from . import config
from . import credits as creditsmod
from . import r2 as r2mod
from . import supabase_client as supa
from . import xendit as xenditmod
from .authz import require_role, require_user
from .schemas import (
    JobCreate,
    JobOut,
    PayoutAccountCreate,
    PlanOut,
    PlanSave,
    PresignRequest,
    PresignResponse,
)

app = FastAPI(title="TukangClip API", version="0.9.0")

from .marketplace import router as marketplace_router
from .distribusi import router as distribusi_router

app.include_router(marketplace_router)
app.include_router(distribusi_router)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/r2/presign", response_model=PresignResponse)
def create_presign(body: PresignRequest, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    if body.mime != "video/mp4":
        raise HTTPException(status_code=400, detail="hanya-mp4")
    try:
        url, key, idem = r2mod.presigned_put(user_id, body.filename, body.bytes, body.kind)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return PresignResponse(uploadUrl=url, r2Key=key, idempotencyKey=idem)


@app.post("/jobs", response_model=JobOut)
def create_job(body: JobCreate, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    if body.mime != "video/mp4":
        raise HTTPException(status_code=400, detail="hanya-mp4")
    if body.bytes <= 0 or body.bytes > config.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="ukuran-tidak-valid")
    import uuid

    client = supa.service_client()
    cost = 1
    if creditsmod.balance_of(client, user_id) < cost:
        raise HTTPException(status_code=402, detail="kredit-kurang")
    idem = str(uuid.uuid4())
    row = {
        "owner_id": user_id,
        "source_r2_key": body.r2Key,
        "source_bytes": body.bytes,
        "source_mime": body.mime,
        "idempotency_key": idem,
    }
    res = client.table("ai_jobs").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="gagal-buat-job")
    j = res.data[0]
    spent = client.table("ai_credit_ledger").insert(
        {
            "user_id": user_id,
            "amount": -cost,
            "balance_after": creditsmod.balance_of(client, user_id) - cost,
            "reason": "pakai-job-ai",
            "ref_job_id": j["id"],
            "idempotency_key": f"spend:{idem}",
        }
    ).execute()
    if not spent.data:
        client.table("ai_jobs").delete().eq("id", j["id"]).execute()
        raise HTTPException(status_code=402, detail="kredit-kurang")
    return JobOut(id=j["id"], status=j["status"], r2Key=j["source_r2_key"])


@app.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    res = client.table("ai_jobs").select("*").eq("id", job_id).single().execute()
    j = res.data
    if not j or j["owner_id"] != user_id:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    return JobOut(id=j["id"], status=j["status"], r2Key=j["source_r2_key"])


def check_moments(moments) -> None:
    if not 5 <= len(moments) <= 10:
        raise HTTPException(status_code=400, detail="momen-harus-5-10")
    ordered = sorted(moments, key=lambda m: m.start)
    for i, m in enumerate(ordered):
        dur = m.end - m.start
        if not 30 <= dur <= 60:
            raise HTTPException(status_code=400, detail=f"durasi-momen-{i + 1}")
        if not m.hook.strip():
            raise HTTPException(status_code=400, detail=f"hook-kosong-{i + 1}")
        if i > 0 and m.start < ordered[i - 1].end:
            raise HTTPException(status_code=400, detail="momen-tumpang-tindih")


@app.post("/plans", response_model=PlanOut)
def save_plan(body: PlanSave, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    check_moments(body.moments)
    client = supa.service_client()
    job = client.table("ai_jobs").select("owner_id").eq("id", body.jobId).single().execute().data
    if not job or job["owner_id"] != user_id:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    vers = client.table("edit_plans").select("version").eq("job_id", body.jobId).execute().data or []
    version = (max([v["version"] for v in vers]) if vers else 0) + 1
    client.table("edit_plans").insert(
        {
            "job_id": body.jobId,
            "version": version,
            "plan": {
                "moments": [m.model_dump() for m in body.moments],
                "titles": body.titles.model_dump()
            },
        }
    ).execute()
    return PlanOut(version=version)


@app.post("/jobs/{job_id}/rerender", response_model=JobOut)
def rerender(job_id: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    job = client.table("ai_jobs").select("*").eq("id", job_id).single().execute().data
    if not job or job["owner_id"] != user_id:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    client.table("ai_jobs").update(
        {"status": "rendering", "lease_until": None, "last_error": None}
    ).eq("id", job_id).execute()
    return JobOut(id=job["id"], status="rendering", r2Key=job["source_r2_key"])


class TopupCreate(BaseModel):
    amount: int


@app.get("/credits")
def credit_balance(authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    rows = (
        client.table("ai_credit_ledger")
        .select("amount,reason,created_at")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    return {"balance": sum(r["amount"] for r in rows), "history": rows[-20:]}


@app.post("/topups")
def create_topup(body: TopupCreate, authorization: str | None = Header(default=None)):
    import uuid

    user_id = require_user(authorization)
    client = supa.service_client()
    s = creditsmod.settings_map(client)
    try:
        q = creditsmod.quote_topup(
            body.amount,
            int(s.get("credit_price_idr", 5000)),
            int(s.get("platform_fee_pct", 10)),
            int(s.get("min_topup_idr", 10000)),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    idem = str(uuid.uuid4())
    intent = {
        "user_id": user_id,
        "amount": body.amount,
        "fee": q["fee"],
        "credits": q["credits"],
        "idempotency_key": idem,
    }
    saved = client.table("topup_intents").insert(intent).execute().data
    if not saved:
        raise HTTPException(status_code=500, detail="gagal-buat-topup")
    try:
        inv = xenditmod.create_invoice(body.amount, idem)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)[:100])
    client.table("topup_intents").update({"xendit_id": inv["id"]}).eq(
        "idempotency_key", idem
    ).execute()
    return {"payUrl": inv["url"], "credits": q["credits"], "fee": q["fee"]}


@app.post("/webhooks/xendit")
async def xendit_webhook(request: Request):
    if not xenditmod.callback_ok(request.headers.get("x-callback-token", "")):
        raise HTTPException(status_code=401, detail="unauthorized")
    body = await request.json()
    if body.get("status") != "PAID":
        return {"ok": True}
    client = supa.service_client()
    intent = (
        client.table("topup_intents")
        .select("*")
        .eq("xendit_id", body.get("id"))
        .single()
        .execute()
        .data
    )
    if not intent:
        raise HTTPException(status_code=404, detail="intent-tidak-ditemukan")
    if intent["status"] == "paid":
        return {"ok": True}
    if intent.get("campaign_id"):
        net = intent["amount"] - intent["fee"]
        camp = client.table("campaigns").select("budget_remaining").eq("id", intent["campaign_id"]).single().execute().data
        client.table("topup_intents").update({"status": "paid"}).eq("id", intent["id"]).execute()
        client.table("campaigns").update(
            {
                "budget_remaining": (camp["budget_remaining"] if camp else 0) + net,
                "escrow": "locked",
            }
        ).eq("id", intent["campaign_id"]).execute()
        client.table("money_ledger").insert(
            {
                "group_id": intent["id"],
                "account": "cash:xendit",
                "user_id": intent["user_id"],
                "campaign_id": intent["campaign_id"],
                "debit": 0,
                "credit": net,
                "idempotency_key": f"fund:{intent['idempotency_key']}:credit",
            }
        ).execute()
        client.table("money_ledger").insert(
            {
                "group_id": intent["id"],
                "account": f"escrow:{intent['campaign_id']}",
                "user_id": intent["user_id"],
                "campaign_id": intent["campaign_id"],
                "debit": net,
                "credit": 0,
                "idempotency_key": f"fund:{intent['idempotency_key']}:debit",
            }
        ).execute()
        return {"ok": True}
    balance = creditsmod.balance_of(client, intent["user_id"])
    credited = client.table("ai_credit_ledger").insert(
        {
            "user_id": intent["user_id"],
            "amount": intent["credits"],
            "balance_after": balance + intent["credits"],
            "reason": "topup-xendit",
            "idempotency_key": f"topup:{intent['idempotency_key']}",
        }
    ).execute()
    if not credited.data:
        return {"ok": True}
    client.table("topup_intents").update({"status": "paid"}).eq("id", intent["id"]).execute()
    return {"ok": True}


@app.post("/payout-accounts")
def save_payout_account(body: PayoutAccountCreate, authorization: str | None = Header(default=None)):
    from . import crypto as cryptomod

    user_id = require_user(authorization)
    client = supa.service_client()
    try:
        sealed = cryptomod.encrypt(body.accountNumber)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    client.table("payout_accounts").insert(
        {
            "user_id": user_id,
            "provider": body.provider,
            "account_ref": sealed,
            "account_name": body.accountName,
        }
    ).execute()
    return {"ok": True}


@app.post("/kyc/{doc_id}/access")
def kyc_access(doc_id: str, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    client = supa.service_client()
    doc = client.table("kyc_documents").select("*").eq("id", doc_id).single().execute().data
    if not doc or doc["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="tidak-ditemukan")
    client.table("kyc_access_log").insert(
        {"doc_id": doc_id, "accessor": user_id, "reason": "buka-berkas"}
    ).execute()
    return {"url": r2mod.presigned_get(doc["file_r2_key"], 300)}


import os as _os

if _prefix := _os.environ.get("API_PREFIX", ""):
    _served = app
    app = FastAPI(title="TukangClip API")
    app.mount(_prefix, _served)

from fastapi.middleware.cors import CORSMiddleware

_origins = [o.strip() for o in _os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins or ["http://localhost:3000", "https://tukangclip.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
