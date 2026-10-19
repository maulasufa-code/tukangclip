import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

from app import main as api
from app.analytics import aggregate_campaign, editor_stats


def test_aggregate_sums_and_paid():
    subs = [
        {"id": "s1", "status": "posted", "views_final": None},
        {"id": "s2", "status": "paid_out", "views_final": 500},
    ]
    snaps = [{"submission_id": "s1", "views": 12000}]
    out = aggregate_campaign(subs, snaps, 30000)
    assert out["total_views"] == 12500
    assert out["posted"] == 2
    assert out["total_paid"] == 30000


def test_editor_stats():
    subs = [{"id": "s1", "status": "posted", "views_final": 2000}]
    out = editor_stats(subs, [], 15000)
    assert out == {"clips_posted": 1, "total_views": 2000, "total_earned": 15000}


class Q:
    def __init__(self, store, table):
        self.store = store
        self.table = table
        self.rows = None
        self.single_mode = False
        self.patch = None
        self.last_op = None

    def select(self, *a):
        self.rows = list(self.store.get(self.table, []))
        return self

    def eq(self, k, v):
        base = self.rows if self.rows is not None else self.store.get(self.table, [])
        self.rows = [r for r in base if r.get(k) == v]
        return self

    def single(self):
        self.single_mode = True
        return self

    def insert(self, row):
        row = dict(row)
        self.last_op = "insert"
        row.setdefault("id", f"gen-{len(self.store.get(self.table, [])) + 1}")
        self.store.setdefault(self.table, []).append(row)
        self.rows = [row]
        return self

    def update(self, patch):
        self.patch = patch
        return self

    def execute(self):
        if self.patch is not None and self.rows is not None:
            for r in self.rows:
                r.update(self.patch)
        if self.last_op == "insert":
            return type("R", (), {"data": self.rows or []})()
        if self.single_mode:
            return type("R", (), {"data": self.rows[0] if self.rows else None})()
        return type("R", (), {"data": self.rows})()


class FakeClient:
    def __init__(self, store):
        self.store = store

    def table(self, name):
        return Q(self.store, name)


def client_with(store, token="creator-1"):
    api.supa.user_id_from_token = lambda t: token
    api.supa.service_client = lambda: FakeClient(store)
    return TestClient(api.app)


def test_oauth_url_youtube():
    c = client_with({}, "user-9")
    r = c.get("/oauth/youtube/url", headers={"authorization": "Bearer x"})
    assert r.status_code == 200, r.text
    assert "accounts.google.com" in r.json()["url"]
    assert "youtube.upload" in r.json()["url"]


def test_oauth_url_tiktok_blocked():
    c = client_with({}, "user-9")
    r = c.get("/oauth/tiktok/url", headers={"authorization": "Bearer x"})
    assert r.status_code == 501


def test_publish_sets_posted(monkeypatch):
    store = {
        "campaigns": [{"id": "c1", "creator_id": "creator-1", "title": "T", "brief": "B"}],
        "applications": [{"id": "a1", "campaign_id": "c1", "editor_id": "editor-1"}],
        "submissions": [{"id": "s1", "application_id": "a1", "status": "approved", "file_r2_key": "k"}],
        "social_accounts": [
            {
                "id": "sa1",
                "user_id": "creator-1",
                "platform": "youtube",
                "access_token": "tok",
                "refresh_token": None,
                "expires_at": "2999-01-01T00:00:00+00:00",
            }
        ],
    }
    import app.distribusi as d

    monkeypatch.setattr(d.socialmod, "youtube_upload", lambda *a: "https://youtu.be/vid1")

    class FakeS3:
        def get_object(self, Bucket, Key):
            class B:
                def read(self):
                    return b"0123456789"

            return {"Body": B()}

    import boto3

    monkeypatch.setattr(boto3, "client", lambda *a, **k: FakeS3())
    c = client_with(store, "creator-1")
    r = c.post("/submissions/s1/publish", json={"platform": "youtube"}, headers={"authorization": "Bearer x"})
    assert r.status_code == 200, r.text
    assert store["submissions"][0]["status"] == "posted"
    assert store["submissions"][0]["posted_url"] == "https://youtu.be/vid1"


def test_publish_rejects_unapproved():
    store = {
        "campaigns": [{"id": "c1", "creator_id": "creator-1", "title": "T", "brief": ""}],
        "applications": [{"id": "a1", "campaign_id": "c1", "editor_id": "editor-1"}],
        "submissions": [{"id": "s1", "application_id": "a1", "status": "submitted", "file_r2_key": "k"}],
        "social_accounts": [],
    }
    c = client_with(store, "creator-1")
    r = c.post("/submissions/s1/publish", json={"platform": "youtube"}, headers={"authorization": "Bearer x"})
    assert r.status_code == 400


def test_laporan_analytics_per_platform_kampanye_dan_periode():
    from datetime import date

    from app.analytics import build_report

    camps = [
        {"id": "c1", "title": "Podcast", "rate_per_1000_views": 5000, "cap_per_clip": 50000,
         "budget_total": 500000, "budget_remaining": 400000}
    ]
    apps = [{"id": "a1", "campaign_id": "c1"}]
    subs = [{
        "id": "s1", "application_id": "a1", "status": "posted",
        "posted_links": [
            {"platform": "youtube", "url": "https://youtu.be/x"},
            {"platform": "tiktok", "url": "https://tiktok.com/v/1"},
        ],
    }]
    snaps = [
        {"submission_id": "s1", "platform": "youtube", "views": 1000, "likes": 50, "comments": 5, "snapshot_date": "2026-10-10"},
        {"submission_id": "s1", "platform": "youtube", "views": 3000, "likes": 90, "comments": 9, "snapshot_date": "2026-10-17"},
        {"submission_id": "s1", "platform": "tiktok", "views": 1000, "likes": 10, "comments": 1, "snapshot_date": "2026-10-17"},
    ]
    r = build_report(camps, apps, subs, snaps, date(2026, 10, 12), date(2026, 10, 18))
    assert r["days"] == 7 and len(r["series"]) == 7
    assert r["totals"]["views"] == 4000 and r["totals"]["likes"] == 100 and r["totals"]["comments"] == 10
    # 4.000 views = 4 x Rp5.000, dibagi menurut views: youtube 3/4, tiktok 1/4.
    assert r["totals"]["estimate"] == 20000
    # Instagram belum punya klip, tapi tetap muncul dengan nol.
    assert {p["platform"]: p["estimate"] for p in r["platforms"]} == {"youtube": 15000, "tiktok": 5000, "instagram": 0}
    assert r["campaigns"][0]["views"] == 4000 and r["campaigns"][0]["videos"] == 2
    # Deret harian membawa snapshot terakhir maju: 12 Okt masih 1.000, 18 Okt sudah 4.000.
    per_hari = {x["date"]: x["views"] for x in r["series"]}
    assert per_hari["2026-10-12"] == 1000 and per_hari["2026-10-18"] == 4000
    # Sebelum periode (11 Okt) sudah ada 1.000 views, jadi tambahan selama periode 3.000.
    assert r["totals"]["views_gain"] == 3000


def test_papan_peringkat_urut_views_dan_hanya_klip_tayang():
    from app.analytics import papan_peringkat

    apps = [
        {"id": "a1", "editor_id": "ani"},
        {"id": "a2", "editor_id": "budi"},
        {"id": "a3", "editor_id": "cici"},
    ]
    subs = [
        {"id": "s1", "application_id": "a1", "status": "posted"},
        {"id": "s2", "application_id": "a1", "status": "posted"},
        {"id": "s3", "application_id": "a2", "status": "posted"},
        {"id": "s4", "application_id": "a3", "status": "submitted"},  # belum tayang, tidak dihitung
    ]
    snaps = [
        {"submission_id": "s1", "platform": "youtube", "views": 5000},
        {"submission_id": "s1", "platform": "tiktok", "views": 1000},
        {"submission_id": "s2", "platform": "youtube", "views": 2000},
        {"submission_id": "s3", "platform": "youtube", "views": 9000},
        {"submission_id": "s4", "platform": "youtube", "views": 99999},
    ]
    nama = {"ani": "Ani", "budi": "Budi", "cici": "Cici"}
    r = papan_peringkat(apps, subs, snaps, nama, saya="ani")
    # Budi 9.000 views (1 klip) di atas Ani 8.000 views (2 klip). Cici tidak masuk karena belum tayang.
    assert [p["nama"] for p in r["papan"]] == ["Budi", "Ani"]
    assert r["papan"][1]["views"] == 8000 and r["papan"][1]["clips"] == 2
    assert r["papan"][1]["poin"] == 8 and r["papan"][0]["poin"] == 9
    assert r["saya"]["rank"] == 2 and r["saya"]["saya"] is True
    assert r["jumlah"] == 2


def test_analytics_endpoint():
    store = {
        "campaigns": [{"id": "c1", "creator_id": "creator-1"}],
        "applications": [{"id": "a1", "campaign_id": "c1", "editor_id": "editor-1"}],
        "submissions": [{"id": "s1", "application_id": "a1", "status": "posted", "views_final": None}],
        "view_snapshots": [{"submission_id": "s1", "views": 8000}],
        "money_ledger": [{"campaign_id": "c1", "account": "payable:editor-1", "credit": 20000}],
    }
    c = client_with(store, "creator-1")
    r = c.get("/campaigns/c1/analytics", headers={"authorization": "Bearer x"})
    assert r.status_code == 200, r.text
    assert r.json()["total_views"] == 8000
    assert r.json()["total_paid"] == 20000
