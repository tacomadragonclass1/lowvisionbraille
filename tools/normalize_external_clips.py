#!/usr/bin/env python3
"""Bring externally-recorded clips (Chatterbox, a human, anything) up to the
same level and padding as the app's existing audio.

WHY THIS EXISTS
---------------
`generate_words.py` normalizes every clip it renders to peak 0.89 (-1.0 dB),
30 ms of leading silence and 140 ms of tail. All 85 shipped clips match that
EXACTLY (measured: peak spread 0.0 dB). Audio recorded elsewhere does not --
the first Chatterbox batch came in at -11.4 dB peak with a 6.5 dB spread and
107 ms of ragged lead. Dropping that straight in makes one section of the app
far quieter than the rest, which on a classroom tablet is an accessibility
regression, not a cosmetic one.

⛔ WHY THIS DOES NOT REUSE generate_words.postprocess()
   That function trims with an ABSOLUTE amplitude floor (0.008) applied BEFORE
   normalizing. That is safe for Kokoro's hot output but destructive on a
   quieter source: the same floor becomes a much higher threshold relative to
   the signal, and the first thing it eats is the low-amplitude release burst
   of a final stop consonant -- the /d/ in "said", the /t/ in "it". That is the
   suspected cause of the existing tail-clipping complaint. Here we normalize
   FIRST and trim against a floor RELATIVE to the peak, set low enough
   (-46 dB) to remove only true silence.

Usage:
    normalize_external_clips.py SRC_DIR OUT_DIR [--peak 0.89]
"""
import argparse, sys, wave
from pathlib import Path
import numpy as np

SAMPLE_RATE = 24000
PEAK        = 0.89   # -1.0 dB, matches generate_words.py
HEAD_MS     = 30
TAIL_MS     = 140
REL_FLOOR   = 10 ** (-46 / 20)   # -46 dB below peak: silence only


def read_mono(path):
    with wave.open(str(path), "rb") as w:
        if w.getsampwidth() != 2:
            sys.exit(f"{path.name}: expected 16-bit, got {w.getsampwidth()*8}-bit")
        sr, ch = w.getframerate(), w.getnchannels()
        d = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768.0
    if ch > 1:
        d = d.reshape(-1, ch).mean(axis=1)
    return d, sr


def process(audio, sr, peak=PEAK):
    if sr != SAMPLE_RATE:
        sys.exit(f"expected {SAMPLE_RATE} Hz, got {sr} -- resample before running this")
    # 1. normalize first, so the trim threshold means the same thing every time
    top = float(np.abs(audio).max())
    if top <= 0:
        raise ValueError("silent clip")
    audio = audio * (peak / top)
    # 2. trim only true silence, relative to peak -- preserves stop releases
    thr = peak * REL_FLOOR
    loud = np.where(np.abs(audio) > thr)[0]
    if len(loud) == 0:
        raise ValueError("silent clip")
    body = audio[loud[0]:loud[-1] + 1]
    # 3. re-pad to the app's fixed envelope
    pad = lambda ms: np.zeros(int(SAMPLE_RATE * ms / 1000))
    out = np.concatenate([pad(HEAD_MS), body, pad(TAIL_MS)])
    return np.clip(out, -1.0, 1.0), len(body)


def write(path, audio):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (audio * 32767).astype("<i2")
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(SAMPLE_RATE)
        out.writeframes(pcm.tobytes())
    return round(len(pcm) / SAMPLE_RATE, 3)


def tail_energy_db(audio, ms=60):
    n = int(SAMPLE_RATE * ms / 1000)
    seg = audio[-n:] if len(audio) >= n else audio
    return 20 * np.log10(max(np.sqrt(np.mean(seg ** 2)), 1e-12))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--peak", type=float, default=PEAK)
    a = ap.parse_args()
    src, out = Path(a.src), Path(a.out)
    files = sorted(src.glob("*.wav"))
    if not files:
        sys.exit(f"no .wav files in {src}")
    print(f"{'file':<22}{'in pk':>8}{'out pk':>8}{'trimmed':>9}{'dur':>7}   stop-release check")
    print("-" * 78)
    for f in files:
        raw, sr = read_mono(f)
        # energy of the last 60 ms of actual signal, before and after
        before = tail_energy_db(raw[np.where(np.abs(raw) > np.abs(raw).max() * REL_FLOOR)[0][-1] - int(SAMPLE_RATE*0.06):][:int(SAMPLE_RATE*0.06)]) \
                 if np.abs(raw).max() > 0 else -999
        proc, body = process(raw, sr, a.peak)
        dur = write(out / f.name, proc)
        # re-measure the released tail of the trimmed body
        body_end = proc[int(SAMPLE_RATE*HEAD_MS/1000) + body - int(SAMPLE_RATE*0.06):
                        int(SAMPLE_RATE*HEAD_MS/1000) + body]
        after = 20*np.log10(max(np.sqrt(np.mean(body_end**2)),1e-12)) if len(body_end) else -999
        gain = 20*np.log10(a.peak/max(np.abs(raw).max(),1e-12))
        keep = "ok" if after - (before + gain) > -1.0 else f"⚠ lost {abs(after-(before+gain)):.1f} dB"
        print(f"{f.name:<22}{20*np.log10(max(np.abs(raw).max(),1e-12)):>8.1f}"
              f"{20*np.log10(max(np.abs(proc).max(),1e-12)):>8.1f}"
              f"{(len(raw)-body)/SAMPLE_RATE*1000:>8.0f}ms{dur:>7.2f}   {keep}")
    print(f"\nwrote {len(files)} files to {out}")


if __name__ == "__main__":
    main()
