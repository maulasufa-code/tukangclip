import re
import uuid
import boto3
from botocore.config import Config as BotoConfig
from . import config


def r2_client():
    return boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=f"https://{config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=config.R2_ACCESS_KEY_ID,
        aws_secret_access_key=config.R2_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


def presigned_put(user_id: str, filename: str, size: int) -> tuple[str, str, str]:
    if size <= 0 or size > config.MAX_UPLOAD_BYTES:
        raise ValueError("ukuran-tidak-valid")
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", filename)[:80] or "video.mp4"
    key = f"raw/{user_id}/{uuid.uuid4()}-{safe}"
    idem = str(uuid.uuid4())
    url = r2_client().generate_presigned_url(
        "put_object",
        Params={"Bucket": config.R2_BUCKET_RAW, "Key": key, "ContentType": "video/mp4"},
        ExpiresIn=config.PRESIGN_TTL,
    )
    return url, key, idem
