import os


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


SUPABASE_URL = env("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = env("SUPABASE_ANON_KEY")
R2_ACCOUNT_ID = env("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = env("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = env("R2_SECRET_ACCESS_KEY")
R2_BUCKET_RAW = env("R2_BUCKET_RAW", "tukangclip-raw")
MAX_UPLOAD_BYTES = int(env("MAX_UPLOAD_BYTES", "2147483648"))
PRESIGN_TTL = 600
