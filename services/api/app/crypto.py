import os


def _fernet():
    raw = os.environ.get("PAYOUT_ENC_KEY", "")
    if not raw:
        raise RuntimeError("kunci-enkripsi-belum-dipasang")
    from cryptography.fernet import Fernet

    return Fernet(raw.encode())


def encrypt(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()
