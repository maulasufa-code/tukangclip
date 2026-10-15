import os
import re

import httpx


def youtube_video_id(url: str) -> str | None:
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{6,})", url)
    return m.group(1) if m else None


def fetch_youtube_views(url: str) -> int:
    key = os.environ.get("YOUTUBE_API_KEY", "")
    if not key:
        raise RuntimeError("youtube-belum-dikonfigurasi")
    vid = youtube_video_id(url)
    if not vid:
        raise ValueError("url-youtube-tidak-valid")
    r = httpx.get(
        "https://www.googleapis.com/youtube/v3/videos",
        params={"part": "statistics", "id": vid, "key": key},
        timeout=20,
    )
    r.raise_for_status()
    items = r.json().get("items", [])
    if not items:
        raise ValueError("video-tidak-ditemukan")
    return int(items[0]["statistics"].get("viewCount", 0))


def fetch_views(platform: str, url: str) -> int:
    if platform == "youtube":
        return fetch_youtube_views(url)
    if platform == "tiktok":
        raise RuntimeError(
            "tiktok-belum-diverifikasi: kunci desain menunggu verifikasi dokumentasi API terbaru"
        )
    raise ValueError("platform-tidak-didukung")
