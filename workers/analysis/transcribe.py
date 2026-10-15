import subprocess


def extract_audio(video_path: str, audio_path: str) -> None:
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-ac", "1", "-ar", "16000", "-vn", "-c:a", "pcm_s16le",
        audio_path,
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def transcribe_words(audio_path: str, model: str = "small") -> tuple[list[dict], float]:
    from faster_whisper import WhisperModel

    fw = WhisperModel(model, device="cpu", compute_type="int8")
    segments, _ = fw.transcribe(audio_path, word_timestamps=True)
    words: list[dict] = []
    duration = 0.0
    for seg in segments:
        duration = max(duration, seg.end)
        for w in seg.words or []:
            words.append({"word": w.word.strip(), "start": w.start, "end": w.end})
    return words, duration
