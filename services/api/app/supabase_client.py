from supabase import create_client
from . import config


def service_client():
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)


def user_id_from_token(token: str) -> str | None:
    client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    try:
        res = client.auth.get_user(token)
        return res.user.id if res.user else None
    except Exception:
        return None
