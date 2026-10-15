from fastapi import Header, HTTPException

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
