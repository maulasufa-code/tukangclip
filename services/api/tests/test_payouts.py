import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from payouts import compute_payout, detect_spike, ledger_pair, sweep_overdue
from tracker import fetch_views, youtube_video_id


def test_payout_caps_and_budget():
    assert compute_payout(100000, 5000, 50000, 1000000) == 50000
    assert compute_payout(4000, 5000, 50000, 1000000) == 20000
    assert compute_payout(4000, 5000, 50000, 15000) == 15000
    assert compute_payout(0, 5000, 50000, 1000000) == 0


def test_spike_flags_abnormal_jump():
    assert detect_spike([100, 120, 140, 50000]) is True
    assert detect_spike([100, 120, 140, 160]) is False
    assert detect_spike([100, 120]) is False


def test_sweep_expires_overdue():
    apps = [
        {"id": "a1", "status": "accepted", "due_at": "2020-01-01T00:00:00+00:00"},
        {"id": "a2", "status": "accepted", "due_at": "2999-01-01T00:00:00+00:00"},
        {"id": "a3", "status": "applied", "due_at": "2020-01-01T00:00:00+00:00"},
    ]
    assert sweep_overdue(apps, "2026-01-01T00:00:00+00:00") == ["a1"]


def test_ledger_pair_balanced():
    legs = ledger_pair("g1", "c1", "e1", "s1", 20000, "idem-1")
    assert sum(x["debit"] for x in legs) == sum(x["credit"] for x in legs) == 20000
    assert legs[0]["group_id"] == legs[1]["group_id"]


def test_youtube_id_parsing():
    assert youtube_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert youtube_video_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert youtube_video_id("https://x.com/bukan") is None


def test_tiktok_blocked_pending_docs():
    import pytest

    with pytest.raises(RuntimeError, match="tiktok-belum-diverifikasi"):
        fetch_views("tiktok", "https://tiktok.com/@x/video/1")
