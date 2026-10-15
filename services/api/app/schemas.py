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


class JobOut(BaseModel):
    id: str
    status: str
    r2Key: str
