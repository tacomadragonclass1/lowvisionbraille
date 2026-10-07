#!/usr/bin/env python3
"""Render the CVC words and the spoken number names with local Kokoro TTS.

Why pre-rendered and not the browser's speechSynthesis: the Web Speech API
needs a user gesture, guarantees no particular voice on any given tablet, and
has a murky licence for a published app. Pre-rendered WAVs are deterministic,
offline, and sound the same on every device the student touches.

Voice is af_heart, lang_code "a": American, female, and the highest-graded
voice Kokoro ships (grade A; af_bella at A- is the only close second).

We shipped British bf_emma first -- Annette's voice from Phonics Farm -- on the
theory that it would match the British phoneme recordings. Milo's verdict was
blunt: "Annette's voice is the worst." Internal consistency with the phonemes
lost to simply sounding good in a Tacoma classroom. Do not go back.

Clips are `pending_user_review`. The assistant cannot hear them and must never
call a pronunciation verified -- Milo chooses by ear, per clip.

Run with the PhonicsFarm TTS venv:
  ~/.local/share/phonicsfarm-tts/venv/bin/python tools/generate_words.py
"""

import argparse
import json
from pathlib import Path
import sys
import wave

SAMPLE_RATE = 24000
REPO = "hexgrad/Kokoro-82M"
DEFAULT_VOICE = "af_heart"
DEFAULT_LANG = "a"

# Milo's list, in Milo's order. The vowel sequence a-i-o-e-u is not
# alphabetical by accident: e and i are the most confusable short vowels, so
# teaching programs separate them. Do not "fix" this to a-e-i-o-u.
WORDS = {
    "a": ["cat", "hat", "sat", "mat", "fat", "rat", "map", "bag", "man", "can"],
    "i": ["sit", "pit", "hit", "fit", "kit", "pig", "lip", "fin", "hid"],
    "o": ["mop", "top", "cop", "hop", "not", "dog", "rob"],
    "e": ["bet", "wet", "met", "set", "get", "bed", "leg"],
    "u": ["cup", "pup", "sun", "run", "fun", "nut"],
}

NUMBERS = ["zero", "one", "two", "three", "four", "five",
           "six", "seven", "eight", "nine"]


def postprocess(audio, peak=0.89, head_ms=30, tail_ms=140, floor=0.008):
    """Trim Kokoro's leading silence, normalize, re-pad. Same shape as the
    PhonicsFarm drivers so these sit at one level with the human phonemes."""
    import numpy as np
    audio = np.asarray(audio, dtype=np.float32)
    loud = np.where(np.abs(audio) > floor)[0]
    if len(loud) == 0:
        raise ValueError("silent clip")
    audio = audio[loud[0]:loud[-1] + 1]
    top = float(np.abs(audio).max())
    if top > 0:
        audio = audio * (peak / top)
    pad = lambda ms: np.zeros(int(SAMPLE_RATE * ms / 1000), dtype=np.float32)
    audio = np.concatenate([pad(head_ms), audio, pad(tail_ms)])
    return (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2")


def write_wav(path, pcm16):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        out.writeframes(pcm16.tobytes())
    return round(len(pcm16) / SAMPLE_RATE, 3)


def render(pipeline, text, voice):
    audio = None
    for _, _, chunk in pipeline(text, voice=voice, speed=1.0):
        if chunk is not None:
            audio = chunk.numpy()
            break
    if audio is None:
        sys.exit(f"no audio for {text!r}")
    return audio


def main():
    root = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=DEFAULT_VOICE)
    ap.add_argument("--lang", default=DEFAULT_LANG,
                    help='Kokoro lang_code: "b" British, "a" American')
    ap.add_argument("--output", type=Path, default=root / "audio")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    from kokoro import KPipeline
    pipeline = KPipeline(lang_code=args.lang, repo_id=REPO, device="cpu")

    records = []

    def emit(text, target, kind, extra):
        if target.exists() and not args.force:
            print(f"keep   {target.name} (exists; --force to replace)", flush=True)
            return
        duration = write_wav(target, postprocess(render(pipeline, text, args.voice)))
        print(f"wrote  {target.name:<12} {duration:>5}s  “{text}”", flush=True)
        records.append(dict(text=text, file=str(target.relative_to(args.output)),
                            kind=kind, voice=args.voice, lang_code=args.lang,
                            duration_seconds=duration, engine="kokoro",
                            status="pending_user_review", **extra))

    for vowel, words in WORDS.items():
        for word in words:
            emit(word, args.output / "words" / f"{word}.wav", "cvc_word",
                 dict(vowel=vowel))

    for digit, name in enumerate(NUMBERS):
        emit(name, args.output / "numbers" / f"{digit}.wav", "number_name",
             dict(digit=digit))

    if records:
        manifest = args.output / "manifest-tts.json"
        existing = json.loads(manifest.read_text())["clips"] if manifest.exists() else []
        merged = {r["file"]: r for r in existing}
        merged.update({r["file"]: r for r in records})
        manifest.write_text(json.dumps(dict(
            source="local Kokoro-82M, Apache-2.0 model and voices",
            format="24 kHz 16-bit mono PCM WAV",
            note="Whole-word and number-name reads only. The isolated letter "
                 "phonemes in audio/phonemes/ are human recordings, not TTS.",
            clips=sorted(merged.values(), key=lambda r: (r["kind"], r["file"])),
        ), indent=2) + "\n")
        print(f"wrote  {manifest.name}", flush=True)

    total = sum(len(w) for w in WORDS.values()) + len(NUMBERS)
    print(f"done   {len(records)} new of {total} clips", flush=True)


if __name__ == "__main__":
    main()
