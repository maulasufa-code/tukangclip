import os
import urllib.parse

import httpx


def base() -> str:
    return os.environ.get("OAUTH_REDIRECT_BASE", "http://localhost:8000")


def youtube_auth_url(state: str) -> str:
    q = urllib.parse.urlencode(
        {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
            "redirect_uri": f"{base()}/oauth/youtube/callback",
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/youtube.upload",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{q}"


def exchange_code(code: str) -> dict:
    r = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
            "redirect_uri": f"{base()}/oauth/youtube/callback",
            "grant_type": "authorization_code",
        },
        timeout=20,
    )
    r.raise_for_status()
    return r.json()


def refresh_token(refresh: str) -> dict:
    r = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "refresh_token": refresh,
            "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
            "grant_type": "refresh_token",
        },
        timeout=20,
    )
    r.raise_for_status()
    return r.json()


def youtube_upload(access_token: str, title: str, description: str, video: bytes) -> str:
    init = httpx.post(
        "https://www.googleapis.com/upload/youtube/v3/videos",
        params={"uploadType": "resumable", "part": "snippet,status"},
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json={
            "snippet": {"title": title[:100], "description": description[:5000]},
            "status": {"privacyStatus": "public"},
        },
        timeout=30,
    )
    init.raise_for_status()
    session = init.headers["location"]
    put = httpx.put(
        session,
        content=video,
        headers={"Content-Length": str(len(video))},
        timeout=600,
    )
    put.raise_for_status()
    return f"https://youtu.be/{put.json()['id']}"


def tiktok_auth_url(state: str) -> str:
    raise RuntimeError(
        "tiktok-belum-diverifikasi: kunci desain menunggu verifikasi dokumentasi API terbaru"
    )
