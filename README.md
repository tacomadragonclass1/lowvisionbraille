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
| **Rhythm** `●■` | — | — | announces the turn, then plays a beat |

Every letter sample on a menu card is **drawn from `PATHS`, not set in a font**
— `glyphWord()` — for the same reason the CVC boxes and the sight word are:
it guarantees the single-story `a` whatever the tablet has installed. The two
strings that cannot be drawn (`Which braille?`, `UEB contractions` — no
uppercase, space or `?` in `PATHS`) fall back to a font stack led by Andika,
and that part is best effort. The Rhythm card carries an **under construction**
note.

**Rhythm is the odd one out** and is deliberately kept that way: no braille, no
print, no items, nothing scored. It owns the whole screen until the adult takes
it back with the ⌂. It is under development — see *The beat game* — and it is
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

Round 2's chain is: the last cell is answered → *"What is this word?"* → **five
seconds of silence** → *"The word is"* → the word. The silence is the activity.
Every step waits on the clip before it ending rather than on a timer of its
own; the five-second think is the one real timer, and it is cancelled by a trip
to the menu like everything else.

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
| A sight word completed, round 1 | The whole word, spoken |
| A sight word completed, round 2 | "What is this word?", five seconds, "The word is …" |
| Shape touched in the minigame | A pop, then the next note of that mode's tune |
| Every 6th completed task | A brain break: Carl's dance, or the beat game |
| BOOM touched in the beat game | A kick drum |
| CLAP touched in the beat game | A snare |
| The beat game's backing | A tick on every eighth, accented on the downbeat, a shaker between |

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
- `audio/letters/` — the spoken letter **names**, for the sight-word section.
  **Rejected and unused** — see the warning above. Kept so a human recording
  drops straight in.
- `audio/sight/` — the eight sight words, plus the two round-2 prompts
  ("What is this word?" and "The word is").
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

The beat game was built as a second break and then **promoted out of the
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

## The beat game

**Its own activity, picked from the menu — under development.** The band plays
a beat, then the student has a turn on two enormous targets, and it runs set
after set until the adult walks out with the ⌂. The turns change length as it
goes.

It has a second shape: run as a **brain break** it plays exactly one set and
hands back to the braille work. That form is built and tested but is not in the
rotation — put `'rhythm'` in `breakRotation` to use it, once this has been
dialled in by ear. `startRhythmActivity()` and `startRhythmBreak()` are the two
entry points; everything below is common to both.

**BOOM is the circle on the left and plays a kick. CLAP is the square on the
right and plays a snare.** Those three facts — shape, side, sound — never
change, in either orientation. A student who cannot see the screen well learns
where the targets are by position and keeps that knowledge; moving them, or
swapping which is which, would throw away the only spatial fact the activity
teaches. **Do not make them responsive in a way that reorders them.**

### Nothing is scored, and that is the design

What the student plays is **not measured, not judged and not spoken about.**
There is no timing window, no accuracy, no mastery gate, no "a bit early", no
retry, no failure. If he gets it he gets it; if he does not, the break ends
anyway and the next one comes round. **The only coaching is visual:** the
circle and the square light up on the beat they belong to.

The targets are an **instrument**, and that is the whole of it. They sound and
flash on every touch — during the band's turn, during the talking, during a
rest. A target that went dead outside some "scored" window would read as
broken.

> A fully scored version of this existed — ±225 ms windows, 75% mastery gates,
> five levels, early/late feedback — and was **removed on purpose on
> 2026-10-19**. It turned a rest between pieces of work into another thing to
> perform. Do not add accuracy back in without asking. If a measured version is
> ever wanted it belongs in its own app, not in the break. The removed design
> is in the git history of this file if it is ever needed.

### A break

The pulse runs continuously from the first measure to the last. Speech lands in
*reserved measures on the same grid*, with the ticks going underneath it, so
the student never loses the beat between the band's turn and his own. The only
thing that stops the pulse is the end of the break.

A **set** is two turns (`RHYTHM_TURNS_PER_SET`). As a break, one set *is* the
whole thing. As the activity, the scheduler lays down the next set while the
current one still has four measures to run, so the pulse carries straight
through the seam and there is no gap to hear. Each turn is:

| | |
| --- | --- |
| an announcement | *"Let's do it for two measures, like this."* |
| **the band** | up to two measures of BOOM CLAP BOOM CLAP |
| | *"Your turn!"* |
| **count-in** | one measure, every beat accented — four even clicks needs no words |
| **the student** | one to four measures. Whatever he plays, the break moves on |

The **first set a student ever gets** is a scripted ramp — one measure, then
two — so the shape of the game is taught by doing it, and the first turn needs
no announcement because *"Okay, let's make a beat!"* has just made it. Every
set after that draws its lengths at random from 1–4, **never the same length
twice running, across the seam between sets as well as inside one.** That
cross-seam case only started mattering when sets began chaining, and it is
easy to miss: a guard that only looked inside a set would still announce "four
measures" twice in a row.

```
activity:  intro → where → yourturn → len2 → yourturn → len4 → yourturn → …
                                                          (until the ⌂)
as a break: intro → where → yourturn → len2 → yourturn → bye        (48s)
            intro → len3  → yourturn → len1 → yourturn → bye
```

As a break it runs 44–60 s. The band never demonstrates for more than
`RHYTHM_DEMO_MAX` (2) measures however long the turn is — the beat is one
measure, so two of them is a complete demonstration, and it stops a
four-measure turn from costing eight.

A long activity session would otherwise grow its own script forever, so
sections that have been fully scheduled and played are pruned;
`rhythmSectionAt()` walks that list on every eighth note. Measured over seven
minutes of continuous play: 140 measures, section list bounded.

### The eight spoken lines

All eight are **announcements of what is about to happen** — never how the
student did. `intro`, `where`, `len1`–`len4`, `yourturn`, `bye`. That is the
whole vocabulary.

`where` ("Boom is the circle on the left. Clap is the square on the right.") is
said **once per session**, on the very first break, keyed off the break count
rather than a flag of its own — a second flag could disagree with the count,
and there is no state in which it should.

**Clip length is load-bearing.** Each line is given whole measures of backing to
itself and starting the next clip stops the one before it, so a line longer
than its room is cut off mid-sentence — which is silent, invisible in the code,
and only audible. `bars` in `RHYTHM_SAY` carries the measured durations;
`rhythmBars()` widens a gap on its own once a clip's real duration has loaded,
so a longer re-record self-corrects from the second break onwards, and `bars`
is what gets the *first* one right. `where.wav` (4.43 s) is the only line
needing two.

### The beat

One measure of slot tokens in `RHYTHM_BEAT`, repeated. `div` is slots per beat,
so `slots.length` must be `RHYTHM_METER * div` — checked at load and warned to
the console, because it is the one mistake a new pattern can make that sounds
plausible but is musically wrong rather than obviously broken.

| token | means |
| --- | --- |
| `B` | BOOM |
| `C` | CLAP |
| `-` | a rest — nothing sounds |
| `b` / `c` | the band plays it and the student is not meant to |

The current beat is `B C B C` and uses none of the lowercase or rest tokens.
They are supported by the player anyway, at a cost of about six lines, because
they are what a harder beat would be built from.

### Timing

**The audio clock is the only clock.** Everything musical is scheduled on the
`AudioContext` clock and nothing musical waits on `setTimeout`. A scheduler
queues the next 1.2 s of audio ahead of the playhead, so the beat is
sample-accurate while the main thread is busy laying out a flash. Visual cues
fire from a rAF loop that compares against what is **currently being heard**
(`getOutputTimestamp().contextTime`, which already carries the output latency
that `currentTime` does not), so a pulse lands with its sound rather than with
its scheduling.

The 1.2 s lookahead against a 60 ms interval is twenty times the headroom it
looks like it needs, on purpose: a browser is free to throttle both
`setTimeout` *and* `requestAnimationFrame` to one call a second, and measured, a
remote-debugged tab does exactly that. Queueing further ahead costs nothing — a
teardown mutes the whole bus in one move, so audio already scheduled is never
heard.

### Tuning dials

| What | Where |
| --- | --- |
| The beat itself | `RHYTHM_BEAT` |
| Tempo, meter | `RHYTHM_BPM`, `RHYTHM_METER` |
| Turns per set | `RHYTHM_TURNS_PER_SET` |
| The scripted first set | `RHYTHM_FIRST_SET` |
| Turn lengths drawn after that | `RHYTHM_LENGTHS` |
| Longest demonstration | `RHYTHM_DEMO_MAX` |
| Count-in length | `RHYTHM_COUNT_IN` |
| Light the shape on the student's turn | `RHYTHM_PRACTICE_GUIDE` |
| Which break activity runs | `breakRotation` |

### Options

- `?mode=rhythm` opens the Rhythm section straight off the splash, skipping the
  menu.
- `?rhythm=1` previews the **brain-break** shape instead — one set, then it
  hands back to the menu by itself.
- `?rbreak=later` skips the scripted opening and goes straight to the random
  lengths.
- `?break=carl` / `?break=rhythm` pins the session to one break activity.
- **Arrow keys**, or `Z` and `M`, play BOOM and CLAP. That is how an adult
  checks the game on a laptop, and it is the path a student on a switch or a
  keyboard takes.

### Tests

```
node tools/rhythm-tests/run.mjs
```

39 assertions, no framework and no install step — node alone runs them, because
a dependency that has to be installed is a dependency that will not be
installed. **The module under test is sliced out of `index.html` at run time**
and executed against a virtual clock with the DOM and Web Audio stubbed, so
what is tested is the shipped code. The central test is that **a student who
hammers both targets throughout gets a byte-identical break** to one who never
touches them — same script, same length, same measures. That is the design,
stated as an assertion. The activity is driven for seven virtual minutes to
check it never ends on its own, never repeats the intro, and keeps its section
list bounded.

A browser cannot test this: a remote-controlled tab throttles
`requestAnimationFrame` to one frame a second (measured), so anything
time-sensitive is meaningless there. The browser is still the right place to
check layout, stacking and teardown — just not timing.

### Known limitations

- **The spoken lines have not been signed off by ear.** They are generated,
  normalized and in place, marked `generated_2026-10-19_awaiting_listen` in
  `audio/manifest-tts.json`.
- **One beat.** Rests, syncopation and "hold the clap" were built and removed
  along with the scoring; the tokens that express them survive.
- **No haptics.** A vibration on each beat would be a real addition for this
  student; `navigator.vibrate` is unavailable on iOS Safari, which is why it is
  not there.

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
- `?rhythm=1` opens the beat game (a brain break) straight off the splash;
  `?rbreak=later` skips its scripted opening; `?break=carl` / `?break=rhythm`
  pins which break activity the session uses. See *The beat game*.
- The *Full screen* button hides browser chrome.
- The `⌂` at the top **left** returns to the activity menu on a **double tap**.
  The **first** tap lights the button up and nothing else happens; a second tap
  inside 650ms goes back. It is 40×32 in the very corner — small, but legible
  grey on a bordered pill, because **an adult has to be able to find it**. It
  was `#555` on `#121212` at 48% opacity until 2026-10-06 and was effectively
  invisible at arm's length; don't dim it again. The **double tap is what
  protects the activity**, not the camouflage.
- The `×` at the top right exits, also on a double tap, and **stays dim on
  purpose.** The asymmetry is deliberate: going back to the menu is routine,
  quitting the app is not.
- Going home mid-word, mid-reward-round or mid-brain-break is safe — a session
  counter invalidates any timer still in flight, so nothing advances behind the
  menu, and the break's music and dance are torn down with it.

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
| Print letter size in its box | `--boxSize` on `#boxes` |
| Which break activity runs | `breakRotation` |

The beat game has its own table of dials — see *The beat game · Tuning dials*.
