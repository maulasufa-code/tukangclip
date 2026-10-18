import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

from app import main as api


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
        if any(
            self.table == "applications"
            and r.get("campaign_id") == row.get("campaign_id")
            and r.get("editor_id") == row.get("editor_id")
            for r in self.store.get(self.table, [])
        ):
            self.rows = None
            return self
        row.setdefault("id", f"gen-{len(self.store.get(self.table, [])) + 1}")
        row.setdefault("status", "applied" if self.table == "applications" else "open")
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


def client_with(store):
    api.supa.user_id_from_token = lambda t: t
    api.supa.service_client = lambda: FakeClient(store)
    return TestClient(api.app)


CREATOR = {"authorization": "Bearer creator-1"}
EDITOR = {"authorization": "Bearer editor-1"}
OTHER = {"authorization": "Bearer orang-lain"}


def base_store():
    return {
        "profiles": [
            {"id": "creator-1", "role": "creator"},
            {"id": "editor-1", "role": "editor"},
            {"id": "orang-lain", "role": "creator"},
        ],
        "campaigns": [],
        "applications": [],
        "submissions": [],
    }


def campaign_payload():
    return {
        "title": "Klip podcast",
        "brief": "Potong 3 klip",
        "budgetTotal": 500000,
        "ratePer1000": 5000,
        "capPerClip": 50000,
    }


def test_creator_creates_campaign():
    c = client_with(base_store())
    r = c.post("/campaigns", json=campaign_payload(), headers=CREATOR)
    assert r.status_code == 200, r.text
    assert r.json()["escrow"] == "locked"


def test_editor_cannot_create_campaign():
    c = client_with(base_store())
    r = c.post("/campaigns", json=campaign_payload(), headers=EDITOR)
    assert r.status_code == 403


def test_apply_accept_submit_review_posted():
    store = base_store()
    c = client_with(store)
    camp = c.post("/campaigns", json=campaign_payload(), headers=CREATOR).json()

    app = c.post(f"/campaigns/{camp['id']}/apply", headers=EDITOR)
    assert app.status_code == 200, app.text

    dup = c.post(f"/campaigns/{camp['id']}/apply", headers=EDITOR)
    assert dup.status_code == 409

    dec = c.post(
        f"/applications/{app.json()['id']}/decision",
        json={"accept": True},
        headers=CREATOR,
    )
    assert dec.status_code == 200
    assert store["applications"][0]["due_at"] is not None

    sub = c.post(
        "/submissions",
        json={"applicationId": app.json()["id"], "fileR2Key": "submissions/e/f.mp4"},
        headers=EDITOR,
    )
    assert sub.status_code == 200, sub.text
    sid = sub.json()["id"]

    rev = c.post(f"/submissions/{sid}/review", json={"approve": True}, headers=CREATOR)
    assert rev.json()["status"] == "approved"

    post = c.post(
        f"/submissions/{sid}/posted",
        json={"url": "https://youtu.be/x", "platform": "youtube"},
        headers=EDITOR,
    )
    assert post.json()["status"] == "posted"


def test_review_rejects_foreign_creator():
    store = base_store()
    store["campaigns"] = [{"id": "c1", "creator_id": "creator-1", "status": "open"}]
    store["applications"] = [{"id": "a1", "campaign_id": "c1", "editor_id": "editor-1", "status": "accepted"}]
    store["submissions"] = [{"id": "s1", "application_id": "a1", "status": "submitted"}]
    c = client_with(store)
    r = c.post("/submissions/s1/review", json={"approve": True}, headers=OTHER)
    assert r.status_code == 403


def test_submit_requires_accepted():
    store = base_store()
    store["applications"] = [{"id": "a1", "campaign_id": "c1", "editor_id": "editor-1", "status": "applied"}]
    c = client_with(store)
    r = c.post("/submissions", json={"applicationId": "a1", "fileR2Key": "x"}, headers=EDITOR)
    assert r.status_code == 400


def test_campaign_list_is_public_and_hides_source():
    store = base_store()
    store["campaigns"] = [
        {"id": "c1", "creator_id": "creator-1", "status": "open", "title": "Klip", "source_url": "https://drive/x"}
    ]
    c = client_with(store)
    r = c.get("/campaigns")
    assert r.status_code == 200, r.text
    item = r.json()["items"][0]
    assert item["title"] == "Klip"
    assert "source_url" not in item and "creator_id" not in item


def test_fund_adds_fee_on_top_and_enforces_minimum(monkeypatch):
    from app import xendit as xenditmod

    store = base_store()
    store["settings"] = [
        {"key": "campaign_fee_pct", "value": {"value": 15}},
        {"key": "min_campaign_topup_idr", "value": {"value": 3000000}},
    ]
    store["campaigns"] = [{"id": "c1", "creator_id": "creator-1", "status": "open"}]
    store["topup_intents"] = []
    dibayar = []
    monkeypatch.setattr(
        xenditmod, "create_invoice", lambda a, e, p=None: dibayar.append(a) or {"id": "x1", "url": "https://pay/x1"}
    )
    c = client_with(store)

    kecil = c.post("/campaigns/c1/fund", json={"amount": 1000000}, headers=CREATOR)
    assert kecil.status_code == 400

    r = c.post("/campaigns/c1/fund", json={"amount": 10000000}, headers=CREATOR)
    assert r.status_code == 200, r.text
    assert r.json()["fee"] == 1500000 and r.json()["total"] == 11500000
    assert dibayar == [11500000]
    intent = store["topup_intents"][0]
    # Webhook mengkredit escrow amount - fee, jadi budget utuh.
    assert intent["amount"] - intent["fee"] == 10000000


def test_apply_blocked_after_three_active_projects():
    c = client_with(base_store())
    ids = [c.post("/campaigns", json=campaign_payload(), headers=CREATOR).json()["id"] for _ in range(4)]
    for cid in ids[:3]:
        assert c.post(f"/campaigns/{cid}/apply", headers=EDITOR).status_code == 200
    r = c.post(f"/campaigns/{ids[3]}/apply", headers=EDITOR)
    assert r.status_code == 409 and r.json()["detail"] == "batas-proyek-aktif"
