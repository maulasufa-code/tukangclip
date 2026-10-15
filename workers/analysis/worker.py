import os
import tempfile
import time

import boto3
from supabase import create_client


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def claim_job(supa):
    return supa.rpc("claim_next_ai_job", {}).execute().data


def set_status(supa, job_id: str, status: str, error: str | None = None):
    supa.table("ai_jobs").update(
        {"status": status, "last_error": error, "lease_until": None}
    ).eq("id", job_id).execute()


def next_version(supa, job_id: str) -> int:
    res = supa.table("edit_plans").select("version").eq("job_id", job_id).execute()
    vers = [r["version"] for r in (res.data or [])]
    return (max(vers) if vers else 0) + 1


def download_r2(key: str, dest: str):
    s3 = boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=f"https://{env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=env("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=env("R2_SECRET_ACCESS_KEY"),
    )
    s3.download_file(env("R2_BUCKET_RAW"), key, dest)


def run_llm(system: str, user: str) -> str:
    from openai import OpenAI

    client = OpenAI(
        api_key=env("LLM_API_KEY"),
        base_url=env("LLM_BASE_URL") or None,
    )
    res = client.chat.completions.create(
        model=env("LLM_MODEL", "gpt-4o-mini"),
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    return res.choices[0].message.content or "{}"


def process_one(supa, job: dict) -> None:
    try:
        from .plan import align_to_sentence, build_prompt, parse_plan
        from .transcribe import extract_audio, transcribe_words
    except ImportError:
        from plan import align_to_sentence, build_prompt, parse_plan
        from transcribe import extract_audio, transcribe_words

    job_id = job["id"]
    set_status(supa, job_id, "transcribing")
    with tempfile.TemporaryDirectory() as d:
        video = f"{d}/src.mp4"
        audio = f"{d}/audio.wav"
        download_r2(job["source_r2_key"], video)
        extract_audio(video, audio)
        words, duration = transcribe_words(audio, env("WHISPER_MODEL", "small"))
        set_status(supa, job_id, "analyzing")
        system, user = build_prompt(words, duration)
        raw = run_llm(system, user)
        plan = parse_plan(raw, job_id)
        aligned = align_to_sentence([m.model_dump() for m in plan.moments], words)
        try:
            from .edit_plan_schema import EditPlan
        except ImportError:
            from edit_plan_schema import EditPlan

        plan = EditPlan.model_validate({**plan.model_dump(), "moments": aligned})
        supa.table("edit_plans").insert(
            {"job_id": job_id, "version": next_version(supa, job_id), "plan": plan.model_dump()}
        ).execute()
    set_status(supa, job_id, "rendering")


def main_loop():
    supa = create_client(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))
    while True:
        job = claim_job(supa)
        if not job:
            time.sleep(10)
            continue
        if isinstance(job, list):
            job = job[0] if job else None
        if not job:
            time.sleep(10)
            continue
        try:
            process_one(supa, job)
        except Exception as e:
            set_status(supa, job["id"], "failed", str(e)[:500])
            time.sleep(5)


if __name__ == "__main__":
    main_loop()
