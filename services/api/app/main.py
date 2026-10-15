from fastapi import FastAPI, Header, HTTPException
from . import config
from . import r2 as r2mod
from . import supabase_client as supa
from .schemas import JobCreate, JobOut, PresignRequest, PresignResponse

app = FastAPI(title="TukangClip API", version="0.2.0")


@app.get("/health")
def health():
    return {"ok": True}


def require_user(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="unauthorized")
    user_id = supa.user_id_from_token(authorization.removeprefix("Bearer ").strip())
    if not user_id:
        raise HTTPException(status_code=401, detail="unauthorized")
    return user_id


@app.post("/r2/presign", response_model=PresignResponse)
def create_presign(body: PresignRequest, authorization: str | None = Header(default=None)):
    user_id = require_user(authorization)
    if body.mime != "video/mp4":
        raise HTTPException(status_code=400, detail="hanya-mp4")
    try:
        url, key, idem = r2mod.presigned_put(user_id, body.filename, body.bytes)
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
    row = {
        "owner_id": user_id,
        "source_r2_key": body.r2Key,
        "source_bytes": body.bytes,
        "source_mime": body.mime,
        "idempotency_key": str(uuid.uuid4()),
    }
    res = client.table("ai_jobs").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="gagal-buat-job")
    j = res.data[0]
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
