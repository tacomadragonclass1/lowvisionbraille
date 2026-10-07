# Low Vision Braille — trace, blend, and count

An offline web app for a low-vision student learning print letter formation,
the braille alphabet, CVC blending, and braille numbers. Open `index.html` —
there is no build step and no network call. The only dependency is the
`audio/` folder next to it.

**Live:** https://tacomadragonclass1.github.io/lowvisionbraille/

Designed for a tablet in landscape, full screen, held in two hands.

## The three activities

After the *Tap to start* splash, an adult picks one. There is deliberately **no
mode button on the activity screen** — he would hit it, and he would hit it in
the middle of a word.

| | Trace | Braille | Speaks |
| --- | --- | --- | --- |
| **Letters** `abc` | a–z | one cell | the letter's phoneme |
| **Words** `cat` | — | three cells, in order | each phoneme, then the whole word |
| **Numbers** `123` | 0–9 | two cells, in order | the number's name |

Picking **Words** then asks which short vowel to drill.

### Letters

Unchanged from the original app. A large letter guide is traced with a finger
while the braille cell lights the dots that letter needs. **Both** are required
to advance. New: finishing the cell now plays that letter's sound — `/b/`, not
"bee".

### Words (CVC)

The three print letters sit in boxes along the top. **There is no tracing
here** — he reads them and answers in braille.

One braille cell is foregrounded at a time: it is full size and bright, its
print box is outlined in the letter colour, and the other two cells are shrunk
and dimmed. He answers the onset, that cell recedes while its phoneme plays and
its box fills green, then the vowel comes forward, then the final consonant.
When all three are done there is a deliberate beat — about 0.7s — and then the
whole word is spoken. The pause is the point: it lands as "n… u… t… NUT" rather
than running the blend straight into the word. Only after the voice finishes
does the screen move on.

The print letters are **drawn from the same centerlines as the tracing guide**,
not set in a font. That is what gives the single-story `a` and the serif-free
`t` that school print wants and Arial does not have, and it means the letter he
reads is identical to the one he traces. The three letters share one vertical
range so their baselines align and an ascender really is taller than an
x-height letter — but the range is the word's own, so a word with no descender
does not sit high in its boxes reserving space for a tail it never grows.

**Backgrounded cells are inert, not merely silent.** If he could answer the
third cell while the first is live, the sequence would stop teaching the order
of the letters, which is the whole point of the activity.

### Numbers

The letter-tracing routine with digits. A braille digit is genuinely two cells —
the number sign (dots 3-4-5-6) followed by the letter `a`–`j` — so he taps the
number sign first, then the digit cell, and traces the printed numeral. All
three must be done before it advances, then the number's name is spoken.

## Sound

| Event | Sound |
| --- | --- |
| Finger on the letter guide | A brush-stroke swoosh, continuous while tracing |
| Finger off the guide, or lifted | Buzz stops immediately |
| A **required** braille dot touched | That dot's fixed tone |
| A ghosted (not required) dot touched | Nothing — silent |
| A braille cell completed | That letter's phoneme |
| A CVC word completed | The whole word, spoken |
| A number completed | The number's name, spoken |
| Shape touched in the minigame | A pop, then that shape's beat of the music |

The brush follows the **finger**, not the gesture: wander off the guide and it
drops out, come back and it returns, with no restart gap. It is pink noise
through a bandpass that **opens as the finger moves faster** — a slow careful
trace is a dark quiet whisper (~700 Hz), a confident sweep is a bright loud
swoosh (~3300 Hz). Resting a finger on the line settles it to a quiet hiss
rather than cutting out, so he can still hear that he is on the line.

### Braille dot tones — C major, one tone per position

The mapping never changes. Position is what the student learns to hear.

| Dot | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Note | C4 | D4 | E4 | F4 | G4 | A4 |

Left column top-to-bottom is C–D–E; right column top-to-bottom is F–G–A.
**Only the dots the current cell needs make a sound.** Ghosted dots are silent.
The app originally sounded every dot so that exploring the cell was audible; in
use that turned the cell into a noise toy — he hit the ghosted dots for the tone
instead of reading the letter. Do not restore it.

### Recorded audio

`audio/` is the one thing `index.html` needs beside it. It plays through plain
`<audio>` rather than `decodeAudioData`, so the app still works opened straight
off a USB stick — `fetch()` is blocked on `file://`, `<audio>` is not.

- `audio/phonemes/` — the 26 letter sounds. **Human recordings**, the same files
  Phonics Farm uses, from the Pronunciation Studio IPA chart. Used here under the
  non-profit educational permission granted for that project; see
  `phonicsfarm/docs/pronunciation-studio-permission.md`. All five short vowels
  are exactly what CVC needs: /a/ pan, /ɛ/ met, /ɪ/ tip, /ɒ/ lock, /ʌ/ fun.
- `audio/treat/` — `musictreat.wav` cut into 13 beats, one per shape in the
  reward round. Milo's own file; kept at its original 44.1 kHz stereo because
  it is music, not speech.
- `audio/words/`, `audio/numbers/` — the 39 CVC words and the ten number names.
  Local Kokoro-82M (Apache-2.0), voice **`af_heart`**: American, female, and the
  highest-graded voice Kokoro ships (grade A; `af_bella` at A- is the only close
  second). These shipped once in British `bf_emma`, on the theory that it would
  match the British phoneme recordings — Milo's verdict was that it sounded bad,
  and sounding good in a Tacoma classroom beat internal consistency with the
  phonemes. Do not go back to a British voice.

Regenerate or re-voice with:

```
~/.local/share/phonicsfarm-tts/venv/bin/python tools/generate_words.py --force
```

`--voice <name> --lang a` swaps the voice; the whole set re-renders in about a
minute. The browser's `speechSynthesis` is **not** used and should not be: it
needs a user gesture, guarantees no particular voice on any given tablet, and
has a murky licence.

## The word list

Grouped by short vowel, in **a-i-o-e-u** order. That is not alphabetical by
accident — `e` and `i` are the most confusable short vowels, so teaching
programs deliberately separate them. Do not "fix" it to a-e-i-o-u.

| Vowel | Words |
| --- | --- |
| a | cat hat sat mat fat rat map bag man can |
| i | sit pit hit fit kit pig lip fin hid |
| o | mop top cop hop not dog rob |
| e | bet wet met set get bed leg |
| u | cup pup sun run fun nut |

Adding a word means adding it to `CVC_WORDS` in `index.html` **and** rendering
its clip with `tools/generate_words.py`.

## The shape minigame

A reward round built on Milo's own recording, `musictreat.wav` — **13 beats, 13
shapes.** One bright shape appears at a time; touching it pops it and plays the
next beat. Beats 1–7 run left to right across the top, then it **wraps back to
the left** for beats 8–13 along the bottom, and the tune completes itself.

It is deliberately **self-paced, not a rhythm game.** The music is cut into one
clip per beat and handed out a touch at a time, so the tune assembles at
whatever speed he works at rather than demanding he keep time with a track.
Tapping during the pop animation is ignored, so a double-tap cannot skip a beat.

Shapes and colours are redrawn at random every round from the standard
kindergarten set — circle, square, triangle, rectangle, oval, diamond, star,
heart, hexagon. There are only 9 shapes and 10 colours for 13 beats, so a round
must repeat some; `sample()` draws from reshuffled batches and never lets the
same shape or colour land twice in a row. **The flow and the beats never
change:** always left to right, always the same 13 beats in order.

### Re-cutting the music

`tools/slice_treat.py <source.wav>` writes `audio/treat/01.wav … 13.wav`.

Finding the beats took two steps, because neither alone works. The source is a
continuous texture, so naive onset detection finds every subdivision — 45 of
them at ~0.175s — and none of them is "the beat". Fitting a regular 13-beat
grid to the spectral flux recovers the real pulse (**91 BPM, 0.659s**). But a
strict grid drifted off the final beat, which landed in the fade-out and gave
the thirteenth shape a nearly silent clip, so each boundary is then snapped to
the strongest transient within 90ms. **Nine of the thirteen move less than 6ms**
— that is the evidence the fitted pulse is right; the snap only rescues the few
that drifted.

If an ear disagrees with the arithmetic, `--beats` takes 13 hand-chosen times in
seconds and skips the fitting entirely.

How often it fires is `MINIGAME_EVERY` in `index.html`: every 4th letter, every
4th number, every **2nd** word — a CVC word is three cells of work, so it earns
a reward twice as often as a single letter. Where the row wraps is `TREAT_ROW1`.

## Tracing

Tracing is deliberately loose, and this is load-bearing: a generous halo around
the thick guide counts, and a stroke is satisfied at 70% coverage (18% for the
dots on `i` and `j`). Do not tighten it to look rigorous — it is a motor
accessibility allowance, not a bug.

Digit centerlines live in the same `PATHS` table as the letters, in the same
space (baseline y=70, x-height top y=0, ascender top y=-30), and are drawn in
school-print writing order.

## Options

- `?mode=letters` / `?mode=words` / `?mode=numbers` — bookmark straight past the
  activity menu. `?mode=words&vowel=i` locks one vowel family.
- `?letter=k` — lock to a single letter for targeted practice.
- The *Full screen* button hides browser chrome.
- The small `⌂` at the top **left** returns to the activity menu on a **double
  tap**. The `×` at the top right exits, also on a double tap. Both are tiny and
  dim on purpose: they are for the adult in the room, and he must not be able to
  find either by flailing at the screen. Going home mid-word or mid-reward-round
  is safe — a session counter invalidates any timer still in flight, so nothing
  advances behind the menu.

## Tuning dials

Single constants in `index.html`, all of them things Milo may want to adjust by
eye or ear:

| What | Where |
| --- | --- |
| Brush loudness | `BRUSH_LEVEL` |
| Brush brightness range | `700+norm*2600` in `brushSpeed()` |
| Reward frequency | `MINIGAME_EVERY` |
| How far backgrounded cells recede | `.cells-2 .cell` / `.cells-3 .cell` scale and opacity |
| Beat before the word is spoken | the `700` in `checkCompletion()` |
| Print letter size in its box | `--boxSize` on `#boxes` |
