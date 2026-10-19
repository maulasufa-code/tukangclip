import os
import re

import httpx


def youtube_video_id(url: str) -> str | None:
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{6,})", url)
    return m.group(1) if m else None


def fetch_youtube_stats(url: str) -> dict:
    key = os.environ.get("YOUTUBE_API_KEY", "")
    if not key:
        raise RuntimeError("youtube-belum-dikonfigurasi")
    vid = youtube_video_id(url)
    if not vid:
        raise ValueError("url-youtube-tidak-valid")
    r = httpx.get(
        "https://www.googleapis.com/youtube/v3/videos",
        params={"part": "statistics,snippet", "id": vid, "key": key},
        timeout=20,
    )
    r.raise_for_status()
    items = r.json().get("items", [])
    if not items:
        raise ValueError("video-tidak-ditemukan")
    st = items[0]["statistics"]
    sn = items[0].get("snippet", {})
    # YouTube tidak mengirim likeCount/commentCount kalau pemilik menyembunyikannya, jadi dianggap 0.
    # YouTube tidak punya angka share di API publik, jadi share tidak diambil.
    return {
        "views": int(st.get("viewCount", 0)),
        "likes": int(st.get("likeCount", 0)),
        "comments": int(st.get("commentCount", 0)),
        "title": sn.get("title", ""),
        "published_at": sn.get("publishedAt"),
    }


def fetch_stats(platform: str, url: str) -> dict:
    if platform == "youtube":
        return fetch_youtube_stats(url)
    if platform == "tiktok":
        raise RuntimeError(
            "tiktok-belum-diverifikasi: kunci desain menunggu verifikasi dokumentasi API terbaru"
        )
    raise ValueError("platform-tidak-didukung")


def fetch_views(platform: str, url: str) -> int:
    return fetch_stats(platform, url)["views"]
