from pydantic import BaseModel, Field


class PresignRequest(BaseModel):
    filename: str = Field(max_length=80)
    bytes: int
    mime: str = "video/mp4"


class PresignResponse(BaseModel):
    uploadUrl: str
    r2Key: str
    idempotencyKey: str


class JobCreate(BaseModel):
    r2Key: str = Field(max_length=512)
    bytes: int
    mime: str = "video/mp4"


class PlanMoment(BaseModel):
    start: float
    end: float
    hook: str = Field(max_length=200)
    effects: list = Field(default_factory=list)


class PlanTitles(BaseModel):
    youtube: str = Field(default="", max_length=100)
    tiktok: str = Field(default="", max_length=150)
    hashtags: list[str] = Field(default_factory=list, max_length=8)


class PlanSave(BaseModel):
    jobId: str
    moments: list[PlanMoment]
    titles: PlanTitles


class PlanOut(BaseModel):
    version: int


class JobOut(BaseModel):
    id: str
    status: str
    r2Key: str
