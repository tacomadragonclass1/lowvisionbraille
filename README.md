# Low Vision Braille — trace, blend, count, and read

An offline web app for low-vision students learning print letter formation,
the braille alphabet, CVC blending, braille numbers, and sight words. Open `index.html` —
there is no build step and no network call. The dependencies are the `audio/`
and `img/` folders next to it — **copy all three or nothing works.**

**Live:** https://tacomadragonclass1.github.io/lowvisionbraille/

Designed for a tablet in landscape, full screen, held in two hands.

## The five activities

After the *Tap to start* splash, an adult picks one. There is deliberately **no
mode button on the activity screen** — a student would hit it, and would hit it
in the middle of a word.

| | Trace | Braille | Speaks |
| --- | --- | --- | --- |
| **Letters** `abc` | a–z | one cell | the letter's phoneme |
| **CVC** `cat` | — | three cells, in order | each phoneme, then the whole word |
| **Numbers** `123` | 0–9 | two cells, in order | the number's name |
| **High Frequency Words** `the` | — | one cell per letter, or the UEB form | the letter names, then the word |
| **Rhythm** `●■` | — | — | plays a beat; the student plays it back |

There is a sixth screen, **Assessment**, which is deliberately *not* on this
menu — it is an adult's control in the corner. See *Assessment*.

Every letter sample on a menu card is **drawn from `PATHS`, not set in a font**
— `glyphWord()` — for the same reason the CVC boxes and the sight word are:
it guarantees the single-story `a` whatever the tablet has installed. The two
strings that cannot be drawn (`Which braille?`, `UEB contractions` — no
uppercase, space or `?` in `PATHS`) fall back to a font stack led by Andika,
and that part is best effort. The Rhythm card carries an **under construction**
note.

**Rhythm is the odd one out** and is deliberately kept that way: no braille, no
print, no items, nothing scored. It owns the whole screen until the adult takes
it back with the ⌂. It is under development — see *The rhythm section* — and it is
**not** in the brain-break rotation today, though it can still run as one.

Picking **CVC** then asks which short vowel to drill; picking **High Frequency
Words** asks which braille convention to use.

### Letters

Unchanged from the original app. A large letter guide is traced with a finger
while the braille cell lights the dots that letter needs. **Both** are required
to advance. New: finishing the cell now plays that letter's sound — `/b/`, not
"bee".

### CVC

The three print letters sit in boxes along the top. **There is no tracing
here** — the student reads them and answers in braille.

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
`t` that school print wants and Arial does not have, and it means the letter the
student reads is identical to the one they trace. The three letters share one vertical
range so their baselines align and an ascender really is taller than an
x-height letter — but the range is the word's own, so a word with no descender
does not sit high in its boxes reserving space for a tail it never grows.

**Backgrounded cells are inert, not merely silent.** If the student could answer the
third cell while the first is live, the sequence would stop teaching the order
of the letters, which is the whole point of the activity.

### Numbers

The letter-tracing routine with digits. A braille digit is genuinely two cells —
the number sign (dots 3-4-5-6) followed by the letter `a`–`j` — so the student taps the
number sign first, then the digit cell, and traces the printed numeral. All
three must be done before it advances, then the number's name is spoken.

### High Frequency Words

Eight high-frequency words — **the, is, it, said, and, as, a, I** — in two
rounds. Round 1 shows the word in print above the dots; **round 2 shows the
dots alone** and asks for the word. Round 2 begins only once round 1 has used
the whole list, so every word has been seen before it is tested, and after
round 2 the section cycles back to round 1.

The print word is deliberately **not** in the CVC letter boxes. A box costs a
border and a gap on every letter, and the point of this section is lettering as
big as the screen allows, so the word is laid out once in glyph space — the
same centerlines the tracing guide uses — and scaled to fill the row. In the
letter-by-letter convention the letter being answered is tinted, and finished
letters go green, which is the vocabulary the CVC boxes use without the chrome.

The cells are **designed** to speak letter NAMES here, not phonemes. A sight
word is recognised and spelled, never sounded out, so "ess, ay, eye, dee" is
the right read-back for `said` and `/s/ /a/ /i/ /d/` is not.

> ### ⚠️ Letter names are MUTED — needed from an educator
>
> The TTS letter names were **rejected on listening** and nothing is spoken as
> a cell is completed. `SIGHT_SPEAK_LETTER_NAMES` in `index.html` is `false`;
> flip it to `true` the moment real recordings exist.
>
> **What is needed:** the spoken *name* of each letter — "tee", not /t/ — as
> `audio/letters/<letter>.wav`. Only **eight** are actually used by this word
> list: **t h e i s a d n**. The other 18 are only needed if the list grows.
>
> **Format:** mono WAV, 24 kHz, 16-bit, trimmed of leading silence and peaking
> around 0.89, so they sit at one level with the rest of the audio.
> `postprocess()` in `tools/generate_words.py` is what the existing clips were
> put through, if it helps to match.
>
> The rejected TTS files are **kept in place, not deleted**, so a human
> recording is a drop-in replacement at the same path and nothing else has to
> change. They are marked `rejected_awaiting_educator_recording` in
> `audio/manifest-tts.json`.
>
> Muting is safe and changes nothing else: a cell with no sound is a path the
> sequencer already takes — it is exactly how the number sign and the capital
> indicator behave. The dot tones still sound, the cell still advances, and the
> word is still spoken at the end.

#### Round 2's chain

The question comes **first**, not last. A round-2 card arrives, *"Let's read
this word together. Say the letter name for each braille letter you touch."*
plays, and **the dots are inert until it finishes** — a quick student could
otherwise beat the prompt on a one-cell word and cut it off. Then:

```
the last cell is answered
  ↓
THE LOOK          5 seconds. Every cell comes forward together - same size,
                  same brightness - and the ghosted dots are HIDDEN, so the
                  only thing on the screen is the word's dot pattern.
                  Nothing is said. The silence is the activity.
  ↓
"The word is"  ->  the word
  ↓
"Good job reading with me!"
  ↓
THE SWELL         the dots grow into full size over 2.2s, then fade over 0.7s
  ↓
the next word
```

The look **hides** the ghosts rather than dimming them, because what is being
studied is the shape of the word in dots and six faint circles per cell is most
of what is on the screen. They go with `visibility`, not `display`, so the cell
keeps its six-position geometry — the real dots must not slide into a new
layout the moment the ghosts leave, or the shape changes while it is being
looked at.

The swell starts at 84% and grows **into** full size rather than past it. The
round-2 `--d` values are already sized so that N *full-width* cells fit the
screen, so scaling past 1 runs a four-cell word off both edges; growing into
the full size is the whole range there is.

Every step waits on the clip before it ending rather than on a timer of its
own. The five-second look and the two animation legs are the only real timers,
and a trip to the menu invalidates all of them — `sightLookOff()` is called
from `setupItem()` and `goHome()`, so neither a normal advance nor a walk-out
can leave the braille row parked mid-swell or invisible.

Round 1 is unchanged: the spelling, a 700 ms beat, then the word, then on.

> This section of the README described the **pre-2026-10-17** order for a
> while — question last, five seconds, answer — after the code had already been
> re-sequenced to ask first. It is correct as written above.

#### Which braille, and why it is asked

The adult picks once, at the start of the section:

| | `the` | `is` | `it` | `said` | `and` | `as` | `a` | `I` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Letter by letter** | ⠞⠓⠑ | ⠊⠎ | ⠊⠞ | ⠎⠁⠊⠙ | ⠁⠝⠙ | ⠁⠎ | ⠁ | ⠠⠊ |
| **UEB** | ⠮ | ⠊⠎ | ⠭ | ⠎⠙ | ⠯ | ⠵ | ⠁ | ⠠⠊ |

Letter by letter is the default and is what the rest of this app teaches. UEB
is how these words actually appear in braille text: `the` and `and` are strong
wordsigns, `it` and `as` are the alphabetic wordsigns for `x` and `z`, and
`said` is the shortform `s-d`. **A wordsign cell is silent** — naming "ex" over
the single cell that means `it` would teach the wrong thing — so under UEB only
the cells that really are that letter in the spelling speak.

**`I` is capitalised in both**: a capital `I` in print, and dot 6 then `i` in
braille. A capital is genuinely two cells, exactly as a digit is, so the
sequencer already knew what to do with it. It is the only capital in the app
and the only glyph in `PATHS` that is not lowercase.

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
| A sight-word cell completed | **Nothing — muted.** Should be that letter's *name*, "tee" not /t/; see the warning above |
| A round-2 sight card appearing | "Let's read this word together…" — dots inert until it ends |
| A sight word completed, round 1 | The whole word, spoken |
| A sight word completed, round 2 | Five seconds of silence, "The word is …", the word, "Good job reading with me!", then the dots swell and fade |
| A braille dot touched in the Assessment section | That dot's tone — but **only** if it is the next one in reading order |
| Shape touched in the minigame | A pop, then the next note of that mode's tune |
| Every 6th completed task | A brain break: Carl's dance |
| BOOM touched in the Rhythm section | A kick drum |
| CLAP touched in the Rhythm section | A clap |
| The Rhythm section's backing | Hi-hats on every eighth and a bass line — no kick or clap, those are the student's |

The brush follows the **finger**, not the gesture: wander off the guide and it
drops out, come back and it returns, with no restart gap. It is pink noise
through a bandpass that **opens as the finger moves faster** — a slow careful
trace is a dark quiet whisper (~700 Hz), a confident sweep is a bright loud
swoosh (~3300 Hz). Resting a finger on the line settles it to a quiet hiss
rather than cutting out, so the student can still hear they are on the line.

### Braille dot tones — C major, one tone per position

The mapping never changes. Position is what the student learns to hear.

| Dot | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Note | C4 | D4 | E4 | F4 | G4 | A4 |

Left column top-to-bottom is C–D–E; right column top-to-bottom is F–G–A.
**Only the dots the current cell needs make a sound.** Ghosted dots are silent.
The app originally sounded every dot so that exploring the cell was audible; in
use that turns the cell into a noise toy — a student will hit the ghosted dots
for the tone instead of reading the letter. Do not restore it.

### Recorded audio

`audio/` must travel with `index.html` (so must `img/`, which holds the single
file `carl.png`). It plays through plain `<audio>` rather than
`decodeAudioData`, so the app still works opened straight off a USB stick —
`fetch()` is blocked on `file://`, `<audio>` is not.

- `audio/phonemes/` — the 26 letter sounds. **Human recordings**, the same files
  Phonics Farm uses, from the Pronunciation Studio IPA chart. Used here under the
  non-profit educational permission granted for that project; see
  `phonicsfarm/docs/pronunciation-studio-permission.md`. All five short vowels
  are exactly what CVC needs: /a/ pan, /ɛ/ met, /ɪ/ tip, /ɒ/ lock, /ʌ/ fun.
- `audio/brainbreak/carlwin.wav` — the brain break music, 10.23s, owner's own
  file. Kept at its original 44.1 kHz stereo because it is music, not speech.
  It is also the **only clip whose length the UI depends on** — the dance is
  timed to it — so replacing it just works, but truncating it silently
  shortens the walk.
- `audio/treat/` — `musictreat.wav` cut into 13 beats by `tools/slice_treat.py`.
  **Currently unused.** It was the reward round until 2026-10-06, when the two
  nursery tunes replaced it; the slices and the tool are kept so that round can
  be brought back without redoing the beat analysis. Nothing fetches them at
  runtime, so they cost page weight only in the repo, not in the browser.
- `audio/assessment/` — `prompt-letter.wav`, the only spoken line in the
  assessment section, and `background.mp3`, its backing music (the owner's own
  file, shipped as supplied). Carl frames the card and deliberately does not
  name the letter; see *Assessment*.
- `audio/letters/` — the spoken letter **names**, for the sight-word section.
  **Rejected and unused** — see the warning above. Kept so a human recording
  drops straight in.
- `audio/sight/` — the eight sight words, plus the three round-2 prompts: the
  ask ("Let's read this word together…"), the reveal ("The word is") and the
  send-off ("Good job reading with me!").
- `audio/words/`, `audio/numbers/` — the 39 CVC words and the ten number names.
  Local Kokoro-82M (Apache-2.0), voice **`af_heart`**: American, female, and the
  highest-graded voice Kokoro ships (grade A; `af_bella` at A- is the only close
  second). These shipped once in British `bf_emma`, on the theory that it would
  match the British phoneme recordings — the owner's verdict was that it sounded bad,
  and sounding good in a classroom beat internal consistency with the
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

A reward round of **seven shapes, seven notes.** One bright shape appears at a
time, left to right; touching it pops it and plays the next note of a nursery
tune, and by the last shape the phrase has completed itself.

**Each section has its own tune, and that is the point.** It is the only cue in
the reward round that says which activity the student is in:

| Mode | Tune | Notes |
| --- | --- | --- |
| Letters | Mary Had a Little Lamb | E D C D E E E |
| Numbers | Mary Had a Little Lamb | E D C D E E E |
| Words (CVC) | Twinkle Twinkle Little Star | C C G G A A G |
| High Frequency Words | London Bridge Is Falling Down | G A G F E F G |

Numbers shares the tracing tune because it *is* a tracing activity — a digit is
traced exactly the way a letter is. Both phrases sit an octave above the braille
dot tones, so a reward never muddles the dot drill, and both end on a longer
note (`LAST_NOTE_DUR`) so the seventh shape resolves instead of just stopping.
Don't shuffle which mode gets which tune.

It is deliberately **self-paced, not a rhythm game.** A note is handed out one
touch at a time, so the tune assembles at whatever speed the student works at rather
than demanding they keep time with a track. Tapping during the pop animation is
ignored, so a double-tap cannot skip a note.

Shapes and colours are redrawn at random every round from the standard
kindergarten set — circle, square, triangle, rectangle, oval, diamond, star,
heart, hexagon. `sample()` draws from reshuffled batches and never lets the same
shape or colour land twice in a row; it also handles asking for more items than
the list holds, which a longer tune would need. A tune longer than `ROW_MAX`
(7) wraps back to the left for a second row. **The flow and the notes never
change:** always left to right, always the same notes in order.

## The brain break

Every **sixth completed task** the activity pauses for a break. Today that is
always Carl's dance.

The rhythm section was built as a second break and then **promoted out of the
rotation on 2026-10-20** to its own menu section, so it can be developed as
something you practise rather than something that interrupts you. Its break
form still works and is still tested — one set, then it hands back — and
putting `'rhythm'` back into `breakRotation` is the whole of re-enabling it.
`?break=rhythm` pins it for a session without editing anything.

`pickBreak()` is the only thing that decides *which* break runs; `taskDone()`
and `BRAIN_BREAK_EVERY` still own *when* one happens. Keeping those two
decisions apart is what made the promotion a one-line change.

### Carl's dance

**The only break there is today.** Carl dances across the screen to his own music
(`audio/brainbreak/carlwin.wav`, 10.23s) and then the activity resumes by itself.

A *task* is any finished piece of work — a letter, a word, a number — **and a
reward round counts as one too**, so the break is paced off everything the student does
rather than off letters alone. In words mode, where a reward round comes every
second word, that works out as: word, word, shapes, word, word, shapes →
break. It was every fourth task until 2026-10-14; in the modes that reward
every second item that put a break after roughly every third word, which was
too often in use.

There is **nothing to tap and no way to get it wrong.** That is the whole
design: it is a rest between pieces of work, not another thing to perform. The
layer is opaque and inert, it ends itself, and it sits *below* the `⌂` and `×`
buttons so the adult in the room can always walk out of it.

Two things in the implementation are load-bearing:

- **It ends on the audio's own `ended` event, never on a timer.** A fixed timer
  either clips the music or leaves the student watching a frozen Carl. The timer that is
  there is a backstop for a file that fails to play at all — without it, a
  blocked `play()` would strand the student on a black screen forever.
- **The travel and the hop are two animations on two elements** (`carlCross` on
  `#carl`, `carlHop` on the image inside it). Splitting them keeps the crossing
  perfectly linear while he bounces, and because both are CSS animations in
  viewport units they re-resolve on rotation for free. `carlCross` goes from
  `translateX(-100%)` to `translateX(100vw)`, so he clears both edges at any
  size. It must be restarted explicitly each break — `forwards` otherwise holds
  him parked off the right edge.

He crosses in 94% of the clip length so he is already gone when the last note
lands. The length comes from the audio element, which is why the clip is
`load()`ed as soon as the splash is dismissed rather than left to `preload`.

### Re-cutting the (currently unused) treat music

`tools/slice_treat.py <source.wav>` writes `audio/treat/01.wav … 13.wav`. This
drove the reward round before the nursery tunes; kept because the analysis was
not cheap to get right.

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
a reward twice as often as a single letter. The brain break has its own
`BRAIN_BREAK_EVERY` (6), counted in tasks rather than items.

## The rhythm section

**Simon says, with a drum kit — under development.** The band plays one
measure, the student plays it back, and getting it right moves them on to a
new one. It runs until the adult walks out with the ⌂.

```
band's measure     targets GREYED OUT, shapes light on their beat
student's measure  targets live, NO lights - that is the whole test
got it             the next pattern in the list
did not            the same pattern demonstrated again
```

**BOOM is the circle on the left and plays the kick. CLAP is the square on the
right and plays the clap.** Shape, side and sound never change, in either
orientation. A student who cannot see the screen well learns where the targets
are by position and keeps that knowledge; **do not make them responsive in a
way that reorders them.**

### No speech at all

Not an intro, not praise, not correction, not a spoken count-in. Everything the
student needs is carried by the groove, the lights and the lock. An earlier
version talked constantly — announcing, encouraging, correcting — and it was
the first thing that had to go: 23–28% of the activity was the tablet talking.

The eight clips in `audio/rhythm/` are therefore **unused**. They are kept
rather than deleted, exactly as `audio/treat/` and `audio/letters/` are, so the
spoken version can be restored without re-rendering. Nothing fetches them, so
they cost repo weight only, not page weight.

### What is judged, and what is not

**Only which shape lands in which slot.** The measure is cut into equal slots
and a tap belongs to the nearest one, so the tolerance is half a slot either
side — about 357 ms at quarter notes, 178 ms at eighths. A measure passes only
if every slot holds exactly what was asked and nothing else was played.

There is deliberately **no early/late reading, no accuracy percentage and
nothing said about timing.** A learner needs the order before they need the
microseconds. An earlier version had ±225 ms windows, 75% mastery gates and
spoken "a bit early" feedback; it was removed on purpose.

Getting it right plays a short rising figure (`RHYTHM_SUCCESS_CHIME`) and moves
on. Getting it wrong does nothing at all except demonstrate the pattern again —
there is no failure state, no streak and no interruption to the groove.

### The lock

While the band demonstrates, both targets go **grey, flat and slightly
smaller**, and the buttons are genuinely `disabled`. Three changes at once,
because a low-vision student may only catch one of them, and a real gate rather
than a hint — a student drumming along with the demonstration must not be able
to spend their turn by accident.

A cue still reads **through** the lock: `#rhythmBoom.locked.cue` outranks
`.locked` by being written after it, so the shape being demonstrated lights
white while its neighbour stays dark. That is the demonstration.

### The patterns

Fifteen, one measure each, in a drummer's order rather than a programmer's: the
backbeat first, then the kick variations a beginner actually meets, then the
eighth-note placements that make a groove swing. `'B'` is BOOM, `'C'` is CLAP,
`'-'` is nothing. `div` is slots per beat, so `slots.length` must be
`RHYTHM_METER * div` — checked at load and warned to the console, because it is
the one mistake a new pattern can make that sounds plausible but is wrong.

The first is the one he is taught by being shown: `B C B C`. Everything after
is a variation, and **nothing is ever longer than a measure.**

### The backing track

Hats and a bass line, every measure, underneath everything **including the
student's own turn** — a groove that stopped for their turn would take the
pulse with it at exactly the moment they need it.

**Neither the kick nor the clap appears in the backing, on purpose.** Those two
sounds belong to the student, and a backing that used them would make it
impossible to hear whose note was whose.

The kit is synthesised, and the first version of it sounded like a test tone.
What changed:

| | before | now |
| --- | --- | --- |
| hat | white noise through a highpass — reads as hiss | six square waves at inharmonic ratios, the analog recipe — reads as metal |
| clap | one noise burst plus a tone | **four** bursts 9 ms apart with a longer tail, which is what a room full of hands actually is |
| kick | sine sweep | sine sweep **plus** a 90 Hz thump, because a tablet speaker reproduces almost nothing below ~150 Hz, through a `tanh` stage so the transient rounds instead of clipping |
| — | nothing else | a **bass line**, which is what makes it a track rather than a metronome |
| — | dry | a short convolution plate, fed by the hats and clap only |
| — | identical every bar | per-hit velocity wander |

The bass sits at A2/C3/G2 — an octave above where a bass normally would — so it
never fights the kick for the same few hertz.

**Levels were set by measurement, not by ear-guessing in code.** Rendering each
voice through an `OfflineAudioContext` found two things that reading the gain
values would not: the kick peaked at **1.046 and clipped**, because its beater
click connected straight to the bus and so summed *on top of* the waveshaper's
ceiling instead of under it; and the clap sat **17 dB under the kick**, which on
a tablet speaker meant the backbeat simply disappeared. Both are fixed, and the
balance now runs clap −3.4 dB, bass −6.1 dB, hats −12.7 dB under the kick, with
the summed groove peaking at 0.97. `RHYTHM_LEVEL` exists because a downbeat
with kick, bass and an accented hat together still summed past 1.0, and a
limiter catching every downbeat is how a mix starts breathing.

### Timing

**The audio clock is the only clock.** Everything musical is scheduled on the
`AudioContext` clock and nothing musical waits on `setTimeout`. A scheduler
queues the next 1.2 s ahead of the playhead, so the beat stays sample-accurate
while the main thread lays out a flash. Visual cues fire from a rAF loop
comparing against what is **currently being heard**
(`getOutputTimestamp().contextTime`, which already carries the output latency
`currentTime` does not), and tap times come from that same clock. Animation
timing is never consulted for anything judged.

The 1.2 s lookahead against a 60 ms interval is twenty times the headroom it
looks like it needs, on purpose: a browser may throttle both `setTimeout` *and*
`requestAnimationFrame` to one call a second, and measured, a remote-debugged
tab does exactly that.

### Tuning dials

| What | Where |
| --- | --- |
| Tempo, meter | `RHYTHM_BPM`, `RHYTHM_METER` |
| The patterns | `RHYTHM_PATTERNS` |
| The groove | `RHYTHM_HATS`, `RHYTHM_BASSLINE` |
| Overall kit level | `RHYTHM_LEVEL` |
| Timing tolerance | `RHYTHM_SLOT_SLOP` |
| Chime on success | `RHYTHM_SUCCESS_CHIME` |
| Call-and-responses per brain break | `RHYTHM_BREAK_TASKS` |
| Which break activity runs | `breakRotation` |

### Options

- `?mode=rhythm` opens it straight off the splash.
- `?rtask=9` starts partway down the pattern list (1-based, as the banner counts).
- `?rhythm=1` previews the **brain-break** shape — a few call-and-responses,
  then it hands back to the menu. That form is not in the rotation; put
  `'rhythm'` in `breakRotation` to use it.
- **Arrow keys**, or `Z` and `M`, play BOOM and CLAP.

### Tests

```
node tools/rhythm-tests/run.mjs
```

62 assertions, no framework and no install step. **The module is sliced out of
`index.html` at run time** and run against a virtual clock, so there is no
second copy of the judge to drift out of step. A simulated student who plays
each pattern back advances through the list; one who does nothing, and one who
mashes, pass nothing and stay on pattern 1. Taps during the lock are proven to
be discarded, not banked.

The three-answer cycle is checked by asserting that **no two student bars ever
run back to back** — which is what "the band demonstrates before every go"
means in testable terms. The separator is checked by reading back the scheduled
oscillator frequencies: the bass voices are identifiable by pitch, so the test
proves the bass really is absent on those bars rather than trusting the code to
read correctly.

A browser cannot test the timing — a remote-controlled tab throttles
`requestAnimationFrame` to one frame a second — but it is the right place for
layout, the lock's appearance, teardown, and rendering the kit offline to
measure it.

### Known limitations

- **Nobody has listened to this on the classroom tablet yet.** The levels are
  measured, not auditioned, and small speakers are exactly where a kick/clap
  balance goes wrong.
- **No swing.** Straight eighths throughout; a shuffle would feel better on
  some of these patterns but would complicate the slot grid the judge uses.
- **One tempo.** 84 bpm for every pattern, including the eighth-note ones,
  which are the hardest.
- **No haptics.** A buzz on each beat would be a real addition for this
  student; `navigator.vibrate` is unavailable on iOS Safari.

## Assessment

**A sitting, not an activity.** Nothing is taught, nothing advances by itself,
and the student cannot move through it — every step is the assessor's. It is
reached by **double-tapping the small `assess` pill directly below the `⌂`**,
which is live both on the activity menu and inside an activity.

It is deliberately not a sixth menu card. A card can be picked by a student
working through the menu, and an assessment started by accident is a wasted
sitting; the double tap is the same guard the `⌂` uses, for the same reason.

### The contrast is flipped

White ground, dark dots. That is not decoration — every other mode in this app
is dark, so the flip is the clearest possible signal to everyone in the room
that practice has stopped. The colour tokens are local to `#assess` rather than
an override of `:root`, so nothing here can leak back into an activity if a
teardown is ever missed.

### What is on the screen

One braille cell, centred, inside a **faint rectangle**. Six dots with nothing
round them read as six separate things; the frame makes them one cell. The
frame is also the only place a finished cell is acknowledged — acknowledging it
in the dots would say something about the letter.

The letter's own dots are drawn dark; the rest are ghosted, exactly as in the
activities.

### Reading order, and why it is not the assessment

**A dot lights only when it is the next one owed** — 1, 2, 3 down the left
column, then 4, 5, 6 down the right. Out of order does nothing at all: no
light, no tone, no buzz. A ghosted dot does nothing either.

That is a habit being kept honest, **not** the thing being measured. What is
being measured is what the student *says* the letter is. A wrong move that
produced a sound would just be a sound to play with instead of a letter to
read, which is the same reasoning that keeps ghosted dots silent everywhere
else.

Carl frames each card with *"This is the letter…"* and **deliberately does not
name it**. No phoneme, no letter name, no word — any of them would answer the
question. The student says the letter aloud to the assessor.

### The assessor's panel

Top left, under the `⌂`. Small, low contrast, and in the corner on purpose: the
assessor can read it because they know it is there and they are an arm's length
away looking for it, and a student reading the cell in the middle of the screen
should never have it pull their eye — or be able to read the answer out of it.

It holds the position (`7 / 26`), a **ghost of the print letter** drawn from the
same centerlines the rest of the app draws from, two pills — **Got it!** and
**Needs More Practice!** — and **Back**, **Next**, **Finish**.

- Re-tapping the chosen pill **clears** it. A mis-tap on a panel this small is
  likely, and leaving no way back from one would quietly put a wrong mark in
  the snapshot.
- **Back does not replay the prompt.** Going back is the assessor correcting a
  mark, not presenting the letter again — and re-asking would tell the student
  their last answer was being reconsidered.
- A letter left unmarked is **not judged**, which is not the same as wrong. It
  is left out of the percentage.

**Below 900px wide the panel becomes a strip along the bottom.** The cell is
centred on the screen and is 3.65 × `--ad` wide, so on a narrow screen its left
edge crosses the panel's right edge and the controls end up on top of the thing
being read. The cell has to stay where the student expects it, so the panel
moves instead. The pills stay stacked in the strip: side by side they get about
95px each on a phone, and "Needs More Practice!" does not fit in 95px — it
would clip, on the one control that must not be misread.

### A round is 26 letters, and can end anywhere

The order is reshuffled every round. **Finish** ends it wherever it has got to
and still gives the snapshot — a short sitting is a real outcome, not an
abandoned one.

### The snapshot

Letters known, letters needing practice, a percentage, and the letters still to
work on in a readable typeface at a readable size — this is a list for an adult
to copy down, so it is typeset, not taught, and it reads alphabetically rather
than in the random order they were shown.

The percentage is **out of what was actually judged**, not out of 26, because
Finish is allowed to end a round early and scoring the letters nobody got to as
failures would turn a short sitting into a bad result. When some letters were
left unmarked a line says so — `9 of 26 letters marked` — because otherwise the
percentage is a number out of an unstated total on a page whose entire purpose
is being copied onto paper by hand.

Leaving is a **double tap** on the button at the bottom.

### Nothing is recorded

The snapshot is read once, written down by hand, and thrown away when the round
closes. There is no storage, no export and no history. A disability record
about a child is not something this app should be accumulating, and an app that
stores nothing cannot leak it.

### The background music

`audio/assessment/background.mp3` — the owner's own file, shipped as supplied
(192 kbps stereo, 3:26) — loops under the whole round at `ASSESS_MUSIC_LEVEL`
(0.18), fading in and out over 900 ms. Low enough to sit under a spoken prompt
and a dot tone without masking either, loud enough to be company rather than a
rumour. It keeps playing through the snapshot and stops when the section
closes. It is the one tuning dial here most likely to want an ear on a real
tablet.

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
- `?mode=rhythm` opens the Rhythm section; `?rtask=N` starts partway down its
  pattern list; `?rhythm=1` previews its brain-break shape; `?break=carl` /
  `?break=rhythm` pins which break activity the session uses. See *The rhythm
  section*.
- The *Full screen* button hides browser chrome. **It is the only thing that
  changes the page's scale** — see *No zoom, ever*.
- The `⌂` at the top **left** returns to the activity menu on a **double tap**.
  The **first** tap lights the button up and nothing else happens; a second tap
  inside 650ms goes back. It is 40×32 in the very corner — small, but legible
  grey on a bordered pill, because **an adult has to be able to find it**. It
  was `#555` on `#121212` at 48% opacity until 2026-10-06 and was effectively
  invisible at arm's length; don't dim it again. The **double tap is what
  protects the activity**, not the camouflage.
- The small `assess` pill **below** the `⌂` opens the assessment section, also
  on a double tap. Unlike the `⌂` it is live on the activity menu too, so the
  assessor does not have to enter a drill in order to leave it. See
  *Assessment*.
- The `×` at the top right exits, also on a double tap, and **stays dim on
  purpose.** The asymmetry is deliberate: going back to the menu is routine,
  quitting the app is not.
- Going home mid-word, mid-reward-round or mid-brain-break is safe — a session
  counter invalidates any timer still in flight, so nothing advances behind the
  menu, and the break's music and dance are torn down with it.

## No zoom, ever

A student half-hitting a braille dot twice in quick succession was zooming the
page. The size is now locked: the only thing that changes it is entering or
leaving full screen.

Five layers, because no single one holds everywhere:

| Layer | Why it alone is not enough |
| --- | --- |
| `user-scalable=no, maximum-scale=1` in the viewport meta | Android respects it; iOS Safari has ignored it since 10 |
| **`touch-action:none` on `*`** | was per-element, which left the gaps BETWEEN them open |
| `gesturestart` / `gesturechange` / `gestureend` refused | WebKit's own pinch events — the technique that holds on an iPad when `touch-action` does not |
| a 2nd finger refused at `touchstart` *and* `touchmove` | a pinch about to happen, not only one in progress |
| a 2nd `touchend` within 350ms and 45px refused | double-tap zoom is a separate mechanism from pinch and survives `touch-action` on some builds |

Plus `dblclick` and ctrl/meta-wheel for a laptop, and a `visualViewport` watcher
that snaps the scale back if an OS gesture gets through anyway.

**The layer that was actually broken was `touch-action`.** It was set on `body`
and on each tappable element by name, which left `.brailleCol` — the flex
column holding dots 1-2-3 — with none at all, and that is precisely the surface
a double tap lands on when it half-misses a dot. It is on `*` now. Nothing in
this app scrolls, so there is no panning to preserve; `#snapLetters`, the one
thing that can legitimately overflow, asks for `pan-y` back by name.

**Only the second tap of a rapid pair is refused**, so every first tap still
produces its `click` — which is what the menu cards listen on. The adult's
double-tap controls are unaffected either way: they fire on `pointerup`, which
has already happened by then.

## Tuning dials

Single constants in `index.html`, all of them things you may want to adjust by
eye or ear:

| What | Where |
| --- | --- |
| Brush loudness | `BRUSH_LEVEL` |
| Brush brightness range | `700+norm*2600` in `brushSpeed()` |
| Reward frequency | `MINIGAME_EVERY` |
| Brain break frequency | `BRAIN_BREAK_EVERY` |
| Double-tap window on ⌂ / × | the `650` in their `pointerup` handlers |
| Which tune each mode gets | `MODE_TUNE` / `TUNES` |
| How big Carl is | `--carlH` |
| How high Carl hops, how fast | `carlHop` keyframes |
| How far backgrounded cells recede | `.cells-2 .cell` / `.cells-3 .cell` scale and opacity |
| Beat before the word is spoken | the `700` in `checkCompletion()` |
| Round 2's silent look at the finished word | `SIGHT_LOOK_MS` |
| How long the round-2 dots swell, then fade | `SIGHT_GROW_MS`, `SIGHT_FADE_MS` |
| Assessment background music level | `ASSESS_MUSIC_LEVEL` |
| How fast that music fades in and out | `ASSESS_MUSIC_FADE` |
| Assessment cell size | `--ad` on `#assessCell` |
| Print letter size in its box | `--boxSize` on `#boxes` |
| Which break activity runs | `breakRotation` |

The Rhythm section has its own table of dials — see *The rhythm section · Tuning dials*.
