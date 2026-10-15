import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from app import main as api
from app import crypto as cryptomod
from app import authz


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


def test_crypto_roundtrip(monkeypatch):
    from cryptography.fernet import Fernet

    monkeypatch.setenv("PAYOUT_ENC_KEY", Fernet.generate_key().decode())
    sealed = cryptomod.encrypt("1234567890")
    assert sealed != "1234567890"
    assert cryptomod.decrypt(sealed) == "1234567890"


def test_crypto_fail_closed(monkeypatch):
    monkeypatch.delenv("PAYOUT_ENC_KEY", raising=False)
    with pytest.raises(RuntimeError, match="kunci-enkripsi-belum-dipasang"):
        cryptomod.encrypt("x")


def test_mfa_verified(monkeypatch):
    class R:
        def raise_for_status(self):
            pass

        def json(self):
            return {"factors": [{"status": "verified"}, {"status": "unverified"}]}

    monkeypatch.setattr(authz.httpx, "get", lambda *a, **k: R())
    assert authz.has_verified_mfa("u1") is True


def test_mfa_missing(monkeypatch):
    class R:
        def raise_for_status(self):
            pass

        def json(self):
            return {"factors": []}

    monkeypatch.setattr(authz.httpx, "get", lambda *a, **k: R())
    assert authz.has_verified_mfa("u1") is False


def test_payout_blocked_without_mfa(monkeypatch):
    from app import authz as authzmod

    monkeypatch.setattr(authzmod, "has_verified_mfa", lambda u: False)
    store = {
        "campaigns": [{"id": "c1", "creator_id": "creator-1", "rate_per_1000_views": 5000, "cap_per_clip": 50000, "budget_remaining": 100000}],
        "applications": [{"id": "a1", "campaign_id": "c1", "editor_id": "editor-1"}],
        "submissions": [
            {
                "id": "s1",
                "application_id": "a1",
                "status": "posted",
                "flagged": False,
                "posted_at": "2020-01-01T00:00:00+00:00",
                "views_final": 10000,
            }
        ],
        "settings": [{"key": "view_hold_days", "value": {"value": 7}}],
    }
    c = client_with(store)
    r = c.post("/submissions/s1/payout", headers={"authorization": "Bearer x"})
    assert r.status_code == 403
    assert r.json()["detail"] == "editor-wajib-2fa"


def test_payout_account_encrypted(monkeypatch):
    from cryptography.fernet import Fernet

    monkeypatch.setenv("PAYOUT_ENC_KEY", Fernet.generate_key().decode())
    store = {"payout_accounts": []}
    c = client_with(store)
    r = c.post(
        "/payout-accounts",
        json={"provider": "BCA", "accountNumber": "1234567890", "accountName": "Nama Editor"},
        headers={"authorization": "Bearer x"},
    )
    assert r.status_code == 200, r.text
    saved = store["payout_accounts"][0]
    assert "1234567890" not in saved["account_ref"]
    assert cryptomod.decrypt(saved["account_ref"]) == "1234567890"


def test_kyc_access_logs_and_signs(monkeypatch):
    monkeypatch.setattr(api.r2mod, "presigned_get", lambda k, ttl=300: f"https://r2/{k}?t={ttl}")
    store = {
        "kyc_documents": [{"id": "k1", "user_id": "creator-1", "file_r2_key": "kyc/a.png"}],
        "kyc_access_log": [],
    }
    c = client_with(store)
    r = c.post("/kyc/k1/access", headers={"authorization": "Bearer x"})
    assert r.status_code == 200, r.text
    assert r.json()["url"].startswith("https://r2/")
    assert len(store["kyc_access_log"]) == 1
    assert store["kyc_access_log"][0]["reason"] == "buka-berkas"


def test_kyc_access_rejects_stranger():
    store = {"kyc_documents": [{"id": "k1", "user_id": "orang-lain", "file_r2_key": "k"}], "kyc_access_log": []}
    c = client_with(store)
    r = c.post("/kyc/k1/access", headers={"authorization": "Bearer x"})
    assert r.status_code == 404
