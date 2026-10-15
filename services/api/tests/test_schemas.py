import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from schemas import JobCreate, PresignRequest


def test_presign_schema_ok():
    r = PresignRequest(filename="a.mp4", bytes=10, mime="video/mp4")
    assert r.mime == "video/mp4"


def test_job_create_schema():
    j = JobCreate(r2Key="raw/u/f.mp4", bytes=100, mime="video/mp4")
    assert j.r2Key.startswith("raw/")
