from fastapi import Header, HTTPException

import httpx

from . import config
from . import supabase_client as supa


def require_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="unauthorized")
    user_id = supa.user_id_from_token(authorization.removeprefix("Bearer ").strip())
    if not user_id:
        raise HTTPException(status_code=401, detail="unauthorized")
    return user_id


def role_of(client, user_id: str) -> str:
    row = client.table("profiles").select("role").eq("id", user_id).single().execute().data
    return (row or {}).get("role", "creator")


def require_role(client, user_id: str, roles: list[str]) -> None:
    if role_of(client, user_id) not in roles:
        raise HTTPException(status_code=403, detail="peran-tidak-cukup")


def has_verified_mfa(user_id: str) -> bool:
    r = httpx.get(
        f"{config.SUPABASE_URL}/auth/v1/admin/users/{user_id}/factors",
        headers={
            "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
        },
        timeout=10,
    )
    r.raise_for_status()
    return any(f.get("status") == "verified" for f in r.json().get("factors", []))
