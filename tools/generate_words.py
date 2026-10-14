#!/usr/bin/env python3
"""Render every pre-rendered TTS clip the app uses, with local Kokoro.

Four sets, each `--only`-selectable: the CVC words, the spoken number names,
the 26 letter NAMES ("tee", not /t/), and the sight-word section's word reads
plus its two spoken prompts.

Letter names are a separate set from audio/phonemes/ on purpose. The phonemes
are human recordings and say the SOUND; the sight-word section needs the
NAME, because a sight word is spelled and recognised, not sounded out.

Why pre-rendered and not the browser's speechSynthesis: the Web Speech API
needs a user gesture, guarantees no particular voice on any given tablet, and
has a murky licence for a published app. Pre-rendered WAVs are deterministic,
offline, and sound the same on every device the student touches.

Voice is af_heart, lang_code "a": American, female, and the highest-graded
voice Kokoro ships (grade A; af_bella at A- is the only close second).

We shipped British bf_emma first -- the British voice from Phonics Farm -- on
the theory that it would match the British phoneme recordings. The owner's
verdict was blunt: that voice was the worst. Internal consistency with the
phonemes lost to simply sounding good in the classroom. Do not go back.

Clips are `pending_user_review`. The assistant cannot hear them and must never
call a pronunciation verified -- the owner chooses by ear, per clip.

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

# The owner's list, in the owner's order. The vowel sequence a-i-o-e-u is not
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

# The spoken NAME of each letter, spelled the way Kokoro's G2P will say it.
# A bare "t" is not reliably read as a letter name, so every one is spelled
# out. These are the clip texts, not the clip contents -- check them by ear.
LETTER_NAMES = {
    "a": "ay", "b": "bee", "c": "see", "d": "dee", "e": "ee", "f": "eff",
    "g": "gee", "h": "aitch", "i": "eye", "j": "jay", "k": "kay", "l": "ell",
    "m": "em", "n": "en", "o": "oh", "p": "pee", "q": "cue", "r": "are",
    "s": "ess", "t": "tee", "u": "you", "v": "vee", "w": "double-you",
    "x": "ex", "y": "why", "z": "zee",
}

# The sight-word section's first tranche, as given. Keyed by the file slug:
# the word "I" is spoken and written capitalised but its clip is sight/i.wav,
# because a filename differing from another only by case is a trap on a
# case-insensitive checkout.
SIGHT_WORDS = {"the": "the", "is": "is", "it": "it", "said": "said",
               "and": "and", "as": "as", "a": "a", "i": "I"}

# Round 2 asks, waits, then answers. Two clips rather than eight rendered
# phrases: the reveal reuses the very word clip from round 1, so there is one
# recording per word to approve rather than two, and nothing can drift apart.
PROMPTS = {"prompt-what": "What is this word?",
           "prompt-reveal": "The word is"}


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
    ap.add_argument("--only", default="all",
                    choices=["all", "words", "numbers", "letters", "sight"],
                    help="render one set instead of all four")
    args = ap.parse_args()
    want = lambda name: args.only in ("all", name)

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

    if want("words"):
        for vowel, words in WORDS.items():
            for word in words:
                emit(word, args.output / "words" / f"{word}.wav", "cvc_word",
                     dict(vowel=vowel))

    if want("numbers"):
        for digit, name in enumerate(NUMBERS):
            emit(name, args.output / "numbers" / f"{digit}.wav", "number_name",
                 dict(digit=digit))

    if want("letters"):
        for letter, spoken in LETTER_NAMES.items():
            emit(spoken, args.output / "letters" / f"{letter}.wav",
                 "letter_name", dict(letter=letter))

    if want("sight"):
        for slug, spoken in SIGHT_WORDS.items():
            emit(spoken, args.output / "sight" / f"{slug}.wav", "sight_word",
                 dict(word=spoken))
        for slug, spoken in PROMPTS.items():
            emit(spoken, args.output / "sight" / f"{slug}.wav", "prompt", {})

    if records:
        manifest = args.output / "manifest-tts.json"
        existing = json.loads(manifest.read_text())["clips"] if manifest.exists() else []
        merged = {r["file"]: r for r in existing}
        merged.update({r["file"]: r for r in records})
        manifest.write_text(json.dumps(dict(
            source="local Kokoro-82M, Apache-2.0 model and voices",
            format="24 kHz 16-bit mono PCM WAV",
            note="Whole-word, number-name, letter-NAME and sight-word reads. "
                 "The isolated letter phonemes in audio/phonemes/ are human "
                 "recordings, not TTS; audio/letters/ is the spoken letter "
                 "NAME and is TTS.",
            clips=sorted(merged.values(), key=lambda r: (r["kind"], r["file"])),
        ), indent=2) + "\n")
        print(f"wrote  {manifest.name}", flush=True)

    total = (sum(len(w) for w in WORDS.values()) + len(NUMBERS)
             + len(LETTER_NAMES) + len(SIGHT_WORDS) + len(PROMPTS))
    print(f"done   {len(records)} new of {total} clips", flush=True)


if __name__ == "__main__":
    main()
