#!/usr/bin/env python3
"""Slice the reward-round music into one clip per beat.

The minigame is self-paced: a shape waits until the student touches it, then
pops and plays its beat. So the music cannot simply be played as a track - it
has to be cut into pieces that are handed out one touch at a time. Thirteen
shapes, thirteen beats, and the tune completes itself as he works across the
screen and wraps back to the left.

The beat grid is FITTED and then SNAPPED, because neither step alone works.
The source is a continuous texture, so naive onset picking finds every
subdivision - 45 of them at ~0.175 s - and no single onset is "the beat".
Fitting a regular grid by maximising the spectral flux that lands on it
recovers the real pulse (~91 BPM, 0.659 s). But a strict grid drifts off the
last beat, which landed in the fade-out and gave the thirteenth shape a nearly
silent clip. So each boundary is then snapped to the strongest transient within
90 ms. Nine of the thirteen move less than 6 ms, which is the evidence that the
fitted pulse is right; the snap only rescues the few that drifted.

Pass --beats to override the whole thing with hand-chosen times if an ear
disagrees with the arithmetic.

  python3 tools/slice_treat.py ~/Desktop/musictreat.wav
"""

import argparse, json, sys, wave
from pathlib import Path

BEATS = 13
FADE_MS = 4.0   # enough to kill the click at a cut, short enough to be inaudible
SNAP_S = 0.09   # how far a fitted beat may move to land on a real transient


def read_wav(path):
    import numpy as np
    with wave.open(str(path), "rb") as w:
        if w.getsampwidth() != 2:
            sys.exit("expected 16-bit PCM")
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype="<i2").reshape(-1, ch)
    return data, sr, ch


def flux_curve(mono, sr):
    import numpy as np
    hop, win = 256, 1024
    frames = 1 + (len(mono) - win) // hop
    window = np.hanning(win).astype(np.float32)
    mags = np.abs(np.stack([np.fft.rfft(mono[i*hop:i*hop+win] * window)
                            for i in range(frames)]))
    flux = np.concatenate([[0], np.maximum(0, np.diff(mags, axis=0)).sum(axis=1)])
    return flux / (flux.max() or 1.0), hop


def snap(beats, flux, hop, sr):
    """Move each boundary onto the strongest transient within SNAP_S."""
    import numpy as np
    out, window = [], int(SNAP_S * sr / hop)
    for x in beats:
        i = int(round(x * sr / hop))
        lo, hi = max(0, i - window), min(len(flux), i + window + 1)
        out.append(float((lo + int(np.argmax(flux[lo:hi]))) * hop / sr))
    return out


def fit_grid(mono, sr):
    """Return (beat_times, period). Scores a regular grid against spectral flux."""
    import numpy as np
    hop, win = 256, 1024
    frames = 1 + (len(mono) - win) // hop
    window = np.hanning(win).astype(np.float32)
    mags = np.abs(np.stack([np.fft.rfft(mono[i*hop:i*hop+win] * window)
                            for i in range(frames)]))
    flux = np.concatenate([[0], np.maximum(0, np.diff(mags, axis=0)).sum(axis=1)])
    flux /= flux.max() or 1.0
    dur = len(mono) / sr

    best = None
    for period in np.arange(0.50, 0.80, 0.001):
        for off in np.arange(0.0, 0.80, 0.005):
            if off + (BEATS - 1) * period > dur - 0.05:
                continue
            total = sum(flux[min(frames - 1, int(round((off + k*period) * sr / hop)))]
                        for k in range(BEATS))
            if best is None or total > best[0]:
                best = (total, period, off)
    _, period, off = best
    return [off + k * period for k in range(BEATS)], period


def main():
    import numpy as np
    root = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser()
    ap.add_argument("source", type=Path)
    ap.add_argument("--output", type=Path, default=root / "audio/treat")
    ap.add_argument("--beats", help=f"override: {BEATS} comma-separated times in seconds")
    args = ap.parse_args()

    data, sr, ch = read_wav(args.source)
    mono = data.mean(axis=1).astype(np.float32) / 32768.0
    if args.beats:
        beats = sorted(float(x) for x in args.beats.split(","))
        if len(beats) != BEATS:
            sys.exit(f"--beats needs exactly {BEATS} times")
        period = (beats[-1] - beats[0]) / (BEATS - 1)
        print(f"{len(mono)/sr:.3f}s  {sr}Hz  {ch}ch  ->  hand-supplied beats")
    else:
        fitted, period = fit_grid(mono, sr)
        flux, hop = flux_curve(mono, sr)
        beats = snap(fitted, flux, hop, sr)
        moved = [abs(b - f) * 1000 for b, f in zip(beats, fitted)]
        print(f"{len(mono)/sr:.3f}s  {sr}Hz  {ch}ch"
              f"  ->  {60/period:.1f} BPM, {period:.4f}s per beat")
        print(f"  snap moved each beat by "
              f"{min(moved):.0f}-{max(moved):.0f}ms "
              f"({sum(1 for m in moved if m < 6)}/{BEATS} under 6ms)")

    # Beat 1 takes everything from the very start, beat 13 everything to the end,
    # so no audio is thrown away at either edge.
    edges = [0.0] + beats[1:] + [len(mono) / sr]
    args.output.mkdir(parents=True, exist_ok=True)
    fade = max(1, int(sr * FADE_MS / 1000))
    records = []
    for k in range(BEATS):
        lo, hi = int(edges[k] * sr), int(edges[k+1] * sr)
        chunk = data[lo:hi].astype(np.float32)
        if len(chunk) > 2 * fade:
            ramp = np.linspace(0, 1, fade, dtype=np.float32)[:, None]
            chunk[:fade] *= ramp
            chunk[-fade:] *= ramp[::-1]
        pcm = np.clip(chunk, -32768, 32767).astype("<i2")
        name = f"{k+1:02d}.wav"
        with wave.open(str(args.output / name), "wb") as o:
            o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
            o.writeframes(pcm.tobytes())
        rms = float(np.sqrt((pcm.astype(np.float32)/32768.0)**2).mean())
        peak = float(np.abs(pcm).max()/32768.0)
        records.append(dict(beat=k+1, file=name, start=round(edges[k], 4),
                            seconds=round((hi-lo)/sr, 4), rms=round(rms, 4),
                            peak=round(peak, 4)))
        print(f"  {name}  {edges[k]:6.3f}s  {(hi-lo)/sr:5.3f}s"
              f"  rms {rms:.4f}  peak {peak:.3f}")

    (args.output / "manifest.json").write_text(json.dumps(dict(
        source=args.source.name, sample_rate=sr, channels=ch,
        bpm=round(60/period, 2), period_seconds=round(period, 4),
        note="One clip per beat. The minigame is self-paced, so each shape "
             "hands out the next beat when it is touched.",
        beats=records), indent=2) + "\n")

    quiet = [r for r in records if r["peak"] < 0.05]
    print("WARNING near-silent beats:", [r["beat"] for r in quiet] or "none")


if __name__ == "__main__":
    main()
