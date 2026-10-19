import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

from app import main as api
from app import credits as creditsmod

SERVER_KEY = "test-server-key"


class Q:
    def __init__(self, store, table):
        self.store = store
        self.table = table
        self.rows = None
        self.single_mode = False
        self.patch = None
        self.pending_delete = False
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
        if self.table == "ai_jobs":
            row.setdefault("status", "queued")
        if any(
            r.get("idempotency_key") == row.get("idempotency_key")
            for r in self.store.get(self.table, [])
        ):
            self.rows = None
            return self
        self.store.setdefault(self.table, []).append(row)
        self.rows = [row]
        return self

    def update(self, patch):
        self.patch = patch
        return self

    def delete(self):
        self.pending_delete = True
        return self

    def execute(self):
        if self.pending_delete and self.rows is not None:
            for r in self.rows:
                if r in self.store.get(self.table, []):
                    self.store[self.table].remove(r)
            return type("R", (), {"data": []})()
        if self.patch is not None and self.rows is not None:
            for r in self.rows:
                r.update(self.patch)
        if self.last_op == "insert":
            return type("R", (), {"data": self.rows or []})()
        if self.single_mode:
            data = self.rows[0] if self.rows else None
        elif self.table in ("settings", "ai_credit_ledger", "topup_intents") and self.patch is None and not self.single_mode:
            data = self.rows
        else:
            data = self.rows[0] if self.rows else None
        return type("R", (), {"data": data})()


class FakeClient:
    def __init__(self, store):
        self.store = store

    def table(self, name):
        return Q(self.store, name)


def client_with(store, token="user-1"):
    api.supa.user_id_from_token = lambda t: token
    api.supa.service_client = lambda: FakeClient(store)
    return TestClient(api.app)


def settings_store():
    return {
        "settings": [
            {"key": "credit_price_idr", "value": {"value": 5000}},
            {"key": "platform_fee_pct", "value": {"value": 10}},
            {"key": "min_topup_idr", "value": {"value": 10000}},
        ]
    }


def test_quote_topup_split_fee():
    q = creditsmod.quote_topup(100000, 5000, 10, 10000)
    assert q == {"fee": 10000, "credits": 18}


def test_quote_topup_rejects_small():
    import pytest

    with pytest.raises(ValueError):
        creditsmod.quote_topup(5000, 5000, 10, 10000)


def test_job_rejects_without_credit():
    c = client_with({**settings_store(), "ai_jobs": [], "ai_credit_ledger": []})
    r = c.post(
        "/jobs",
        json={"r2Key": "raw/u/f.mp4", "bytes": 10, "mime": "video/mp4"},
        headers={"authorization": "Bearer x"},
    )
    assert r.status_code == 402


def test_job_spends_one_credit():
    store = {
        **settings_store(),
        "ai_jobs": [],
        "ai_credit_ledger": [
            {"user_id": "user-1", "amount": 5, "idempotency_key": "topup:a"}
        ],
    }
    c = client_with(store)
    r = c.post(
        "/jobs",
        json={"r2Key": "raw/u/f.mp4", "bytes": 10, "mime": "video/mp4"},
        headers={"authorization": "Bearer x"},
    )
    assert r.status_code == 200, r.text
    assert sum(x["amount"] for x in store["ai_credit_ledger"]) == 4


def midtrans_notif(order_id: str, gross: str, status: str = "settlement", fraud: str = "accept") -> dict:
    import hashlib

    sig = hashlib.sha512(f"{order_id}200{gross}{SERVER_KEY}".encode()).hexdigest()
    return {
        "order_id": order_id,
        "status_code": "200",
        "gross_amount": gross,
        "signature_key": sig,
        "transaction_status": status,
        "fraud_status": fraud,
    }


def test_topup_returns_snap_token(monkeypatch):
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", SERVER_KEY)
    store = {**settings_store(), "topup_intents": []}
    monkeypatch.setattr(
        api.midtransmod,
        "create_transaction",
        lambda oid, amt, title, email=None: {"token": "snap-1", "redirect_url": "https://pay/1"},
    )
    c = client_with(store)
    r = c.post("/topups", json={"amount": 50000}, headers={"authorization": "Bearer x"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["fee"] == 5000 and body["credits"] == 9
    assert body["snapToken"] == "snap-1"
    intent = store["topup_intents"][0]
    assert intent["gateway_ref"] == "tc-" + intent["idempotency_key"]


def test_webhook_credits_once_and_issues_invoice(monkeypatch):
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", SERVER_KEY)
    store = {
        **settings_store(),
        "topup_intents": [
            {
                "id": "t1",
                "user_id": "user-1",
                "amount": 50000,
                "fee": 5000,
                "credits": 9,
                "status": "pending",
                "gateway_ref": "tc-idem-1",
                "idempotency_key": "idem-1",
            }
        ],
        "ai_credit_ledger": [],
        "invoices": [],
    }
    c = client_with(store)
    body = midtrans_notif("tc-idem-1", "50000.00")
    assert c.post("/webhooks/midtrans", json=body).status_code == 200
    assert c.post("/webhooks/midtrans", json=body).status_code == 200
    assert sum(x["amount"] for x in store["ai_credit_ledger"]) == 9
    assert store["topup_intents"][0]["status"] == "paid"
    assert len(store["invoices"]) == 1
    assert store["invoices"][0]["number"].startswith("INV-")


def test_webhook_rejects_bad_signature(monkeypatch):
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", SERVER_KEY)
    c = client_with({})
    body = midtrans_notif("idem-1", "50000.00")
    body["gross_amount"] = "1.00"
    r = c.post("/webhooks/midtrans", json=body)
    assert r.status_code == 401


def test_webhook_ignores_pending(monkeypatch):
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", SERVER_KEY)
    c = client_with({})
    body = midtrans_notif("idem-1", "50000.00", status="pending")
    assert c.post("/webhooks/midtrans", json=body).status_code == 200


def test_webhook_ignores_order_from_other_platform(monkeypatch):
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", SERVER_KEY)
    c = client_with({})
    body = midtrans_notif("platform-lain-123", "50000.00")
    r = c.post("/webhooks/midtrans", json=body)
    assert r.status_code == 200 and r.json()["diabaikan"] is True
