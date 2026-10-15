import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

from app import main as api


class Q:
    def __init__(self, store, table):
        self.store = store
        self.table = table
        self.row = None
        self.patch = None

    def select(self, *a):
        return self

    def eq(self, k, v):
        rows = [r for r in self.store.get(self.table, []) if r.get(k) == v]
        self.row = rows[0] if rows else None
        return self

    def single(self):
        return self

    def insert(self, row):
        self.store.setdefault(self.table, []).append(row)
        self.row = row
        return self

    def update(self, patch):
        self.patch = patch
        return self

    def execute(self):
        if self.patch is not None and self.row is not None:
            self.row.update(self.patch)
        if self.table == "edit_plans" and self.row is None:
            return type("R", (), {"data": self.store.get(self.table, [])})()
        return type("R", (), {"data": self.row})()


class FakeClient:
    def __init__(self, store):
        self.store = store

    def table(self, name):
        return Q(self.store, name)


def moment(i):
    s = float(i * 70)
    return {"start": s, "end": s + 35, "hook": f"Kunci {i}", "effects": []}


def client_with(store):
    api.supa.user_id_from_token = lambda t: "user-1"
    api.supa.service_client = lambda: FakeClient(store)
    return TestClient(api.app)


def test_save_plan_creates_version_1():
    store = {"ai_jobs": [{"id": "j1", "owner_id": "user-1"}], "edit_plans": []}
    c = client_with(store)
    r = c.post(
        "/plans",
        json={
            "jobId": "j1",
            "moments": [moment(i) for i in range(5)],
            "titles": {"youtube": "Y", "tiktok": "T", "hashtags": []},
        },
        headers={"authorization": "Bearer x"},
    )
    assert r.status_code == 200, r.text
    assert r.json() == {"version": 1}


def test_save_plan_rejects_short_moment():
    store = {"ai_jobs": [{"id": "j1", "owner_id": "user-1"}], "edit_plans": []}
    c = client_with(store)
    ms = [moment(i) for i in range(5)]
    ms[0]["end"] = ms[0]["start"] + 10
    r = c.post(
        "/plans",
        json={"jobId": "j1", "moments": ms, "titles": {"youtube": "Y", "tiktok": "T", "hashtags": []}},
        headers={"authorization": "Bearer x"},
    )
    assert r.status_code == 400


def test_save_plan_rejects_foreign_job():
    store = {"ai_jobs": [{"id": "j1", "owner_id": "orang-lain"}], "edit_plans": []}
    c = client_with(store)
    r = c.post(
        "/plans",
        json={
            "jobId": "j1",
            "moments": [moment(i) for i in range(5)],
            "titles": {"youtube": "Y", "tiktok": "T", "hashtags": []},
        },
        headers={"authorization": "Bearer x"},
    )
    assert r.status_code == 404


def test_rerender_queues_rendering():
    store = {
        "ai_jobs": [{"id": "j1", "owner_id": "user-1", "status": "done", "source_r2_key": "raw/x.mp4"}]
    }
    c = client_with(store)
    r = c.post("/jobs/j1/rerender", headers={"authorization": "Bearer x"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "rendering"
    assert store["ai_jobs"][0]["status"] == "rendering"
