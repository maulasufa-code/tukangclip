from pydantic import BaseModel, Field, field_validator

MIN_MOMENTS = 5
MAX_MOMENTS = 10
MIN_DUR = 30.0
MAX_DUR = 60.0


class EffectCue(BaseModel):
    effect_id: str = Field(min_length=1, max_length=64)
    at: float = Field(ge=0)


class ClipMoment(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    score_viral: float = Field(ge=0, le=100)
    hook: str = Field(min_length=1, max_length=200)
    caption_style: str = Field(default="punchy", max_length=32)
    effects: list[EffectCue] = Field(default_factory=list)

    @field_validator("end")
    @classmethod
    def end_after_start(cls, v: float, info) -> float:
        start = info.data.get("start", 0)
        dur = v - start
        if dur < MIN_DUR or dur > MAX_DUR:
            raise ValueError(f"durasi momen harus {MIN_DUR}-{MAX_DUR} detik")
        return v


class TitlePack(BaseModel):
    youtube: str = Field(max_length=100)
    tiktok: str = Field(max_length=150)
    hashtags: list[str] = Field(max_length=8)


class EditPlan(BaseModel):
    job_id: str
    moments: list[ClipMoment] = Field(min_length=MIN_MOMENTS, max_length=MAX_MOMENTS)
    titles: TitlePack

    @field_validator("moments")
    @classmethod
    def no_overlap(cls, v: list[ClipMoment]) -> list[ClipMoment]:
        ordered = sorted(v, key=lambda m: m.start)
        for a, b in zip(ordered, ordered[1:]):
            if b.start < a.end:
                raise ValueError("momen tidak boleh tumpang tindih")
        return ordered
