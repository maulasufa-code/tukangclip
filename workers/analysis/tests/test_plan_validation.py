import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from edit_plan_schema import EditPlan
from plan import align_to_sentence, build_prompt, parse_plan


def moment(i: int, dur: float = 35.0) -> dict:
    s = float(i * 70)
    return {
        "start": s,
        "end": s + dur,
        "score_viral": 80.0,
        "hook": f"Kunci {i}",
        "caption_style": "punchy",
        "effects": [],
    }


def titles() -> dict:
    return {"youtube": "Judul YT", "tiktok": "Judul TT", "hashtags": ["#klip"]}


def test_valid_plan_passes():
    p = EditPlan(job_id="j1", moments=[moment(i) for i in range(5)], titles=titles())
    assert len(p.moments) == 5


def test_too_few_moments_fails():
    with pytest.raises(Exception):
        EditPlan(job_id="j1", moments=[moment(i) for i in range(3)], titles=titles())


def test_bad_duration_fails():
    bad = [moment(i) for i in range(5)]
    bad[0] = {**bad[0], "end": bad[0]["start"] + 10}
    with pytest.raises(Exception):
        EditPlan(job_id="j1", moments=bad, titles=titles())


def test_overlap_fails():
    ms = [moment(i) for i in range(5)]
    ms[1] = {**ms[1], "start": ms[0]["start"] + 5, "end": ms[0]["start"] + 40}
    with pytest.raises(Exception):
        EditPlan(job_id="j1", moments=ms, titles=titles())


def test_parse_plan_sets_job():
    raw = json.dumps({"moments": [moment(i) for i in range(5)], "titles": titles()})
    p = parse_plan(raw, "job-9")
    assert p.job_id == "job-9"


def test_parse_plan_rejects_garbage():
    with pytest.raises(Exception):
        parse_plan("bukan json", "job-9")


def test_prompt_capped_words():
    words = [{"word": "halo", "start": float(i), "end": float(i) + 0.3} for i in range(3000)]
    _, user = build_prompt(words, 1800.0)
    assert user.count("halo") <= 2000


def test_align_snaps_end_to_word():
    words = [{"word": "a", "start": 0.0, "end": 34.6}, {"word": "b", "start": 34.6, "end": 35.0}]
    ms = [{**moment(0), "end": 34.9}]
    out = align_to_sentence(ms, words)
    assert out[0]["end"] == pytest.approx(35.0)
