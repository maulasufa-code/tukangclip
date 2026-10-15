import json

try:
    from .edit_plan_schema import EditPlan
except ImportError:
    from edit_plan_schema import EditPlan

SYSTEM = (
    "Kamu pemotong video. Balas HANYA JSON valid tanpa teks lain. "
    "Pilih 5-10 momen, tiap 30-60 detik, hook kuat di 3 detik pertama, "
    "potong di batas kalimat. effect_id bebas diisi, validator Fase 3 yang membersihkan."
)

USER_TMPL = """Transkrip per kata (word,start,end):
{words}

Durasi video: {duration}s. Efek yang boleh dipakai bebas, tulis id sementara.
Judul Indonesia santai dan spesifik, tanpa klaim palsu.
Format: {{"moments": [{{"start": 0, "end": 35, "score_viral": 80, "hook": "...", "caption_style": "punchy", "effects": []}}], "titles": {{"youtube": "...", "tiktok": "...", "hashtags": []}}}}"""


def build_prompt(words: list[dict], duration: float) -> tuple[str, str]:
    compact = [f"{w['word']},{w['start']:.2f},{w['end']:.2f}" for w in words[:2000]]
    return SYSTEM, USER_TMPL.format(words="\n".join(compact), duration=round(duration, 1))


def parse_plan(raw: str, job_id: str) -> EditPlan:
    data = json.loads(raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```"))
    data["job_id"] = job_id
    plan = EditPlan.model_validate(data)
    words_ok = all(m.hook.strip() for m in plan.moments)
    if not words_ok:
        raise ValueError("hook kosong")
    return plan


def align_to_sentence(moments: list[dict], words: list[dict]) -> list[dict]:
    ends = {round(w["end"], 2) for w in words}
    out = []
    for m in moments:
        s, e = round(m["start"], 2), round(m["end"], 2)
        if ends and e not in ends:
            near = min(ends, key=lambda x: abs(x - e))
            if abs(near - e) <= 1.5:
                e = near
        out.append({**m, "start": s, "end": e})
    return out
