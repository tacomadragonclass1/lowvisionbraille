# Low Vision Braille — trace, blend, count, and read

An offline web app for low-vision students learning print letter formation,
the braille alphabet, CVC blending, braille numbers, and sight words. Open `index.html` —
there is no build step and no network call. The dependencies are the `audio/`
and `img/` folders next to it — **copy all three or nothing works.**

**Live:** https://tacomadragonclass1.github.io/lowvisionbraille/

Designed for a tablet in landscape, full screen, held in two hands.

## The six activities

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
| **Write** | free, anywhere | — | the brush, under the stroke |

There is a seventh screen, **Assessment**, which is deliberately *not* on this
menu — it is an adult's control in the corner. See *Assessment*.

Every letter sample on a menu card is **drawn from `PATHS`, not set in a font**
— `glyphWord()` — for the same reason the CVC boxes and the sight word are:
it guarantees the single-story `a` whatever the tablet has installed. The two
strings that cannot be drawn (`Which braille?`, `UEB contractions` — no
uppercase, space or `?` in `PATHS`) fall back to a font stack led by Andika,
and that part is best effort. The Rhythm card carries an **under construction**
note.

**Rhythm and Write are the odd ones out** and are deliberately kept that way.
Both own the whole screen until the adult takes it back with the ⌂, and neither
has items, an order, or anything to get right. Write additionally has no sound
of any kind and no break — see *The write playground*.

Of Rhythm specifically: no braille, no
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

### Write

A **playground**, not an activity — see *The write playground* for the detail.
A white page, a finger or a stylus, and ink that **changes colour every time
you lift off**. Hold **two fingers** down to bring up an eraser and wipe. The
tracing brush plays under the stroke. Nothing is taught, nothing is scored,
nothing advances, and there is no music and no brain break.

### High Frequency Words

Thirty-five high-frequency words — **the, is, it, said, and, as, a, I, you,
has, was, to, one**, then **all, am, an, are, at, away, be, because, black,
blue, brown, but, by, can, came, come, could, day, do, eat, eight, first** — in
two rounds. Round 1 shows the word in print above the dots; **round 2 shows the
dots alone** and asks for the word.

#### The two rounds are shuffled together into one deck

**Changed 2026-10-30.** The section used to run all of round 1 and then all of
round 2. At thirteen words that was a 26-card cycle; at thirty-five it would
have been **seventy cards before a word came round again**, so the rounds are
now interleaved and a card may be either kind.

The rule is that **a word's round-2 card only appears once its round-1 card has
played** — it is never tested from dots before it has been seen in print. That
is not checked after the fact, it comes from how the deck is built: each word
goes in **twice**, the whole list is shuffled, and walking it a word's *first*
appearance is its round-1 card and its *second* is its round-2 card. A second
occurrence is by definition after a first, so the rule holds by construction,
and the result is a uniformly random interleaving rather than the biased one a
place-then-retry loop would give.

Two consequences are guaranteed rather than likely, and both are load-bearing:

- **The first card of a deck is always round 1**, because the first token of a
  shuffled list is necessarily a first occurrence. Round 2 autoplays its
  question as the card arrives, which browsers only allow after a user
  gesture — this is what keeps that legal on the opening card of a session.
  ⛔ Do not replace the deck with a scheme that can deal round 2 first.
- **Every word is still read in print before it is tested from dots alone**,
  which was the entire point of the old two-pass order.

One side effect worth knowing: nothing stops a word's two cards landing
**back-to-back**, which makes that one card an echo rather than a recall. The
rate is low — measured over 300 decks, **1.0 of the 35 words per 70-card deck**
— so it is left alone rather than fixed with a minimum-gap rule. If it ever
needs to go, that is where to add it.

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
> `audio/letters/<letter>.wav`. Only **nineteen** are actually used by this
> word list: **a b c d e f h i k l m n o r s t u w y**. The other seven
> (**g j p q v x z**) are only needed if the list grows again. (It was eight
> until the second tranche added *you, has, was, to, one*, which pulled in
> **o u w y**; the third tranche of twenty-two pulled in **b c f k l m r**.) A capital is lowercased before the
> lookup, so `I` asks for `i.wav` and there is no uppercase file to record.
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

#### The third tranche, and where the UEB spellings come from

The first two tranches' UEB forms were written by hand and cross-checked
against the alphabet table. The third tranche of twenty-two was not: every
form is the output of **liblouis 3.33 translating the word through the
official `en-ueb-g2` table**, and each result was translated **back** to
confirm it round-trips to the word it came from.

Running that same table over the first two tranches reproduced **twelve of
those thirteen entries exactly**. The thirteenth was a real error, and it has
been corrected:

> ✅ **`one` was wrong and is now fixed.** It was `o-n-e` spelled in full, with
> a comment claiming "no contraction". Real UEB is the **dot-5 initial-letter
> contraction** — dot 5 then `o` — the same series as `day` in the third
> tranche. All thirty-five words now round-trip through `en-ueb-g2` exactly.
> This is the one place where what a shipped word looks like in braille
> changed, so it is worth knowing if something looks different in the UEB
> convention.

Worth knowing about the forms themselves, because they are not all spellings:
`but`, `can`, `do` and `be` are **single cells** (alphabetic or lower
wordsigns), `because` is the shortform `bec`, `could` is `cd` and `first` is
`fst`, and `are`, `brown` and `eight` carry the `ar`, `ow` and `gh`
groupsigns. The silent-cell rule from the first tranche is unchanged: a cell
is spoken only when it **is** that letter in the spelling, so groupsigns,
wordsigns and the dot-5 prefix are all silent. `tools/write-tests` asserts
that the spoken cells of every word are the word's own letters **in order**,
which is the exact shape of that rule.

#### ⚠️ The longest word is now SEVEN cells, and the dots are smaller for it

In the letter-by-letter convention — the default — a word costs one cell per
print letter, so `because` is **seven cells** where nothing before this
tranche went past four. The `cells-N` rules in the stylesheet run to seven for
that reason, and the `vw` term for each count is the solution to the row's
width budget rather than a guess; the arithmetic is written out beside the
rules.

**Measured in a browser at four viewports** (tablet 1280×800, phone in both
orientations, a 414px-tall laptop), every count from one to seven fits the row
in both rounds, nothing overflows, and the gap *inside* a cell stays larger
than the gap *between* cells at every count — which is the thing that keeps
the dots reading as groups.

What it costs is dot size, and this is the trade to be aware of:

| | 3-cell word | 7-cell word (`because`) |
|---|---|---|
| round 1, tablet 1280×800 | 84px dots | **46px** |
| round 2, tablet 1280×800 | 130px dots | **59px** |

The print row shrinks the same way, because a word's box is its own ink: on
the tablet `because` renders at a **135px x-height** against 237px for the
previous smallest word. On the assessment's print-word card it is **86px**,
the smallest of the thirty-five, and **no word intrudes on the assessor panel**
— checked across all cards, the ink starts at x=248 with the panel ending at
x=199.

None of that is a defect, but a seven-cell word is the smallest the dots have
ever been in this section, and a longer word would make them smaller again.
**Measure before adding one.**

#### Round 2's chain

The question comes **first**, not last. A round-2 card arrives, *"Let's read
this word together. Say the letter name for each braille letter you touch."*
plays, and **the dots are inert until it finishes** — a quick student could
otherwise beat the prompt on a one-cell word and cut it off. Then:

```
the last cell is answered
  ↓
THE LOOK          5 seconds. Every cell comes forward together - same size,
                  same brightness - the ghosted dots are HIDDEN, and each cell
                  is FRAMED in its own rectangle. Nothing is said. The silence
                  is the activity.
  ↓
"The word is"  ->  the word
  ↓
"Good job reading with me!"
  ↓
THE HOLD          2.2s more of the framed word, still
  ↓
                  it fades over 0.7s, and the next word comes up
```

The look **hides** the ghosts rather than dimming them, because what is being
studied is the shape of the word in dots and six faint circles per cell is most
of what is on the screen. They go with `visibility`, not `display`, so the cell
keeps its six-position geometry — the real dots must not slide into a new
layout the moment the ghosts leave, or the shape changes while it is being
looked at.

#### ⭐ Every cell is framed, and it has to be

Hiding the ghosts on its own was **confusing in use**, and the reason is in the
measurements: the gap *between* two cells is about 21px on a four-cell word,
and the gap between the two dot **columns inside one cell** is about 34px. They
are the same order of size. With the ghosts gone, a lone dot 4 reads just as
easily as its neighbour's dot 1 — which letter a dot belongs to stops being
visible at all. The ghosted dots had been carrying that grouping, and nothing
replaced them.

Each cell now gets its own rounded rectangle. Two things make it work:

- It is an **`outline`**, not a border or padding. An outline is drawn outside
  the border box *without reflow*, so adding it cannot move a single dot — the
  shape being studied must not shift at the moment it is framed.
- The cells sit at **86%** during the look, and that is what makes room for the
  frame. A transform does not change the width a cell *occupies* (see the
  four-cell note above), so scaling down frees visual space inside each cell's
  own slot without moving the slots. Measured on the worst case — "said",
  four cells, round-2 sizes — the frames end up **26px apart and never
  overlap**.

The frame is deliberately visible rather than tasteful. It is the only thing
carrying which dot belongs to which letter, so a line too polite to be seen at
arm's length fails the whole purpose of it; it stays dimmer than the dots,
which are the content.

> **There used to be a swell here** — the dots grew into full size over the
> 2.2s before the fade. It was dropped on 2026-10-25: the movement was the
> wrong idea, but the *pacing* was right, so the 2.2s is kept as a still hold
> and the chain is the same length it was.

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

| Word | Letter by letter | UEB | Why the UEB form is what it is |
| --- | --- | --- | --- |
| `the` | ⠞⠓⠑ | ⠮ | strong wordsign |
| `is` | ⠊⠎ | ⠊⠎ | no contraction |
| `it` | ⠊⠞ | ⠭ | alphabetic wordsign `x` |
| `said` | ⠎⠁⠊⠙ | ⠎⠙ | shortform `s-d` |
| `and` | ⠁⠝⠙ | ⠯ | strong wordsign |
| `as` | ⠁⠎ | ⠵ | alphabetic wordsign `z` |
| `a` | ⠁ | ⠁ | single cell either way |
| `I` | ⠠⠊ | ⠠⠊ | capital indicator, then `i` |
| `you` | ⠽⠕⠥ | ⠽ | alphabetic wordsign `y` |
| `has` | ⠓⠁⠎ | ⠓⠁⠎ | no contraction — and `h` **alone** means *have*, so spelling it is the reading that cannot be mistaken |
| `was` | ⠺⠁⠎ | ⠴ | lower wordsign: the letter `j` dropped one row |
| `to` | ⠞⠕ | ⠞⠕ | no contraction — UEB removed the old unspaced `to` |
| `one` | ⠕⠝⠑ | ⠕⠝⠑ | no contraction |

Letter by letter is the default and is what the rest of this app teaches. UEB
is how these words actually appear in braille text. **A wordsign cell is
silent** — naming "ex" over the single cell that means `it` would teach the
wrong thing — so under UEB only the cells that really are that letter in the
spelling speak.

Every dot above is cross-checked against the `BRAILLE` table in `index.html`
rather than typed by hand; `was` is worth a second look if you are editing it,
because 3-5-6 is not any letter's cell.

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
| A sight word completed, round 2 | Five seconds of silence, "The word is …", the word, "Good job reading with me!", then the framed word holds and fades |
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
- `audio/assessment/` — three spoken lines and the backing music.
  `prompt-letter.wav` frames a braille card; `prompt-word.wav` frames a print
  card in the visual round; `prompt-next.wav` acknowledges that the assessor has
  marked one, without saying what the mark was. `background.mp3` is the backing
  music (the owner's own file, shipped as supplied). Carl frames cards and
  deliberately never reads the answer; see *Assessment*.
- `audio/letters/` — the spoken letter **names**, for the sight-word section.
  **Rejected and unused** — see the warning above. Kept so a human recording
  drops straight in.
- `audio/sight/` — the thirty-five high-frequency words, plus the three round-2
  prompts: the ask ("Let's read this word together…"), the reveal ("The word
  is") and the send-off ("Good job reading with me!"). **Filenames are the
  lowercased word**, so `I` ships as `i.wav`.
- `audio/words/`, `audio/numbers/` — the 39 CVC words and the ten number names.
  ⛔ **`audio/numbers/` files are named by DIGIT (`8.wav`) but say the WORD
  ("eight")** — generate from the manifest's `text` field, never from the
  filename.

#### Which engine actually voices what

**Every clip the app plays is the Chatterbox `carlvoice` clone**, not Kokoro.
The sight words, CVC words and number names were all re-recorded in Chatterbox
on 2026-10-17 because the Kokoro reads were rejected on listening; the only
Kokoro files left are `audio/letters/`, which is muted and never played.

| Folder | Engine |
| --- | --- |
| `phonemes/` | human recordings (Pronunciation Studio) |
| `sight/`, `words/`, `numbers/`, `assessment/` | Chatterbox `carlvoice` clone |
| `letters/` | Kokoro — **muted**, awaiting an educator |
| `brainbreak/`, `treat/`, `assessment/background.mp3` | the owner's own music |

Settings, recovered from the server log to match clips already approved by ear:
**`carlvoice.wav` clone, seed 898, temperature 0.8**, via the Chatterbox REST
API on `:8004`. The server ignores `exaggeration` and `cfg_weight` — it runs
chatterbox-turbo, where temperature, seed and the reference audio are the only
levers.

> ⛔ **`tools/generate_words.py` only renders the muted `audio/letters/` now.**
> Do not use it for anything the app plays. Its `postprocess()` trims with an
> **absolute** amplitude floor applied *before* normalising, which on a quieter
> source eats the low-amplitude release of a final stop — "bag" becomes "ba-".
>
> Anything recorded elsewhere goes through **`tools/normalize_external_clips.py`**
> instead, which normalises *first* and trims against a floor **relative** to
> peak (−46 dB, silence only), then verifies each stop release survived. It
> brings clips to the same −1.0 dB peak, 30 ms head and 140 ms tail as the rest
> of the audio — which matters on a classroom tablet, where one section being
> quieter than the others is an accessibility regression, not a cosmetic one.
>
> ```
> tools/normalize_external_clips.py SRC_DIR OUT_DIR
> ```
>
> **`tools/make_review_page.py`** writes `_review.html`, a one-page auditioner
> with a play button per clip and "play all in order" per group, un-approved
> clips first. It is a tracked tool because the page had been hand-rebuilt
> three times; the page itself stays gitignored. `--compare because is has as
> was` puts a side-by-side row at the top, which is how a fricative-final clip
> gets judged against ones that already passed.
>
> ⛔ **Serve the working tree with `Cache-Control: no-store` while auditioning.**
> A plain `python -m http.server` does not, and this repo's stale-asset trap
> will have you listening to the OLD wav while debugging the new one.
>
> ⚠️ **Its release check only tests PLOSIVES.** A weak final **fricative** —
> /z/, /s/, /v/, /f/ — passes it silently. That is not theoretical: `was`
> shipped with its final /z/ at **−30.9 dB**, about 10 dB under `is` and 7
> under `has`, present in the spectrum but too quiet to hear on a tablet, and
> the tool reported `ok`. Check a fricative-final clip by comparing the level
> and high-frequency share of its last ~200 ms against an approved clip that
> ends the same way.
>
> The third tranche had exactly one fricative-final word, **`because`**, so
> that check was run on it: its final 200 ms sits at **−26.4 dB**, inside the
> −35.7…−24.6 dB spread of the four approved /z/-final clips (`as`, `has`,
> `is`, `was`), and its energy above 3 kHz is **0.990** of the window —
> higher than all four (0.941–0.988).
>
> ⚠️ **And it is still the weak one.** Judged weak by ear and shipped anyway as
> good enough, marked `approved_weak_2026-10-30` and left as a to-do for the
> next round. **That is the useful part of this story:** every measure-only
> check passed, including the one built for exactly this failure class, and the
> ear disagreed. The measurements are a filter, not a verdict. When it is
> redone, measurement will not find the problem — a different seed or a
> phonetic respelling is the lever, the same move that fixed `was`.

#### Phonetic respellings

A clip is generated from the manifest's `text`, which does **not** have to be
the word. When Chatterbox mispronounces or under-articulates a word, the fix is
to respell it phonetically and record that in the manifest — `was` is rendered
from **`wuz`** (and on seed 77 rather than the batch's 898), which took its
final /z/ from −30.9 dB to −23.0, between `has` and `said`. The rhythm clips
have the same pattern: `cha` became `clap` because Chatterbox would not say it.

**The filename still has to be the word**, because the app builds it that way —
`audio/sight/<word.toLowerCase()>.wav`. So `was.wav` contains "wuz", and the
manifest carries `word`, `seed` and a `note` explaining why. ⛔ **Regenerate
from the manifest's `text` and `seed`, never from the filename**, or the bug
comes straight back.

The browser's `speechSynthesis` is **not** used and should not be: it needs a
user gesture, guarantees no particular voice on any given tablet, and has a
murky licence.

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
| The writing playground's ink | `WRITE_INK` (declared beside `COLOR_PAIRS`) |
| Its stroke weight | `WRITE_WIDTH_FRAC` / `_MIN` / `_MAX` |
| Whether it makes any sound | `WRITE_BRUSH` — **on** since 2026-10-28 |
| How big the eraser is | `WRITE_ERASER_MULT` |
| What still counts as a two-finger gesture | `WRITE_ERASE_GRACE`, `WRITE_ERASE_SLOP` |

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

## The write playground

**No objective.** Nothing to get right, nothing that advances by itself, no
score, no praise, no reward round and no brain break. A white page for
practising letter formation with a finger or a stylus, which ends when the
adult takes it back with the `⌂`. It is the only screen in the app that asks
nothing of anybody.

White ground, for the same reason the assessment is white: every teaching mode
here is dark, so a light screen says at a glance that this is not a drill.

### The ink changes colour on every pen-up

That is the whole feature. Lift the finger or the stylus, and the next stroke
is a different colour. It makes each stroke a separate, visible thing — so
**where one stroke ended and the next began stays readable after the fact**,
instead of disappearing into one continuous line. That is useful for letter
formation, where stroke count and stroke order are most of the skill, and it is
also just fun.

The palette is deliberately dark and saturated, because the page is white:

| | ink | vs white | |
| --- | --- | --- | --- |
| 1 | `#1a1a1a` near-black | 17.40:1 | AAA |
| 2 | `#c62828` red | 5.62:1 | AA |
| 3 | `#1565c0` blue | 5.75:1 | AA |
| 4 | `#bf360c` orange | 5.60:1 | AA |
| 5 | `#2e7d32` green | 5.13:1 | AA |
| 6 | `#6a1b9a` purple | 9.39:1 | AAA |
| 7 | `#00695c` teal | 6.61:1 | AA |
| 8 | `#ad1457` magenta | 6.97:1 | AA |

**Every ink clears WCAG AA against white**, worst case 5.13:1 — which is the
point of choosing them by measurement rather than by eye in a low-vision app.
A first pass used `#e65100` for the orange and it failed at **3.79:1**; the
darker `#bf360c` replaces it. They are also *ordered* so consecutive strokes
are as unlike each other as possible — adjacent pairs are at least **67 ΔE**
apart, so a colour change can never be mistaken for the same stroke continuing.

> ⛔ **`WRITE_INK` is declared up with `COLOR_PAIRS`, not in the write section**,
> because the menu card's artwork is built before that section is reached and a
> `const` cannot be used ahead of its declaration. Moving it back down throws at
> load and takes the whole app with it.

> ⛔ **The menu card draws a white page behind its three marks.** The palette is
> built for a white ground and its first entry is near-black, so drawn straight
> onto the `#1d1d1d` card the first mark is invisible — the same black-on-black
> mistake the `⌂` shipped with once.

### The brush

The same brush the letter tracing plays, and it follows the hand here rather
than the guide — there is no guide to be on or off. Speed brightens the filter
and lifts the level exactly as it does in Letters, so a fast stroke is brighter
than a slow one and a stroke that stops moving settles to a hiss instead of
cutting out.

It shipped **off** on 2026-10-27, on the reading that "no music" meant silence
and on the worry that a sound rewarding movement gets farmed for its own sake —
the ghosted-dots lesson. That was wrong in use and it was **turned on the next
day**: in a section with no objective there is nothing for the sound to distract
*from*, and the feedback is most of what makes a stroke feel like a stroke.
`WRITE_BRUSH` still toggles it.

> ⛔ `brushSpeed()` takes **px per millisecond**, not a distance. The first
> version of this handler passed a raw gap between points, which pegs the
> filter at full brightness on every move. It needs the clock, and the interval
> wants the same floor the tracing canvas uses — a 1 ms gap on a fast digitiser
> reports an absurd speed. A test asserts on the units.

### The two-finger eraser

**Hold two fingers down and wipe.** An eraser appears at the midpoint of the
two, and anything under it is taken away for as long as they are held. Lift to
one finger and it stops.

The ring around the eraser is the honest part: it is drawn at exactly the size
of the area being cleared, so what is about to go is never a guess. The eraser
is `WRITE_ERASER_MULT` times the width of the pen, floored so it stays a rubber
rather than a nib on a small screen.

- **An erase is an entry in the display list**, not just white paint on the
  canvas. Painting white alone would look right and then *come back* on the
  next repaint, because a rotation replays the page from that list. Recording
  the wipe in order is what makes it survive.
- **The half-started stroke is discarded.** Two fingers never land at the same
  instant, so the first one is always a fraction of a stroke — and leaving that
  dot behind after every wipe would be maddening. It is dropped only if it was
  genuinely part of the gesture: within `WRITE_ERASE_GRACE` ms and under
  `WRITE_ERASE_SLOP` px of travel. A long, deliberate stroke that someone then
  adds a second finger to is **kept**.
- **Lifting to one finger does not start drawing.** The hand that was erasing
  has to come off the page completely first, or every wipe would end with an
  accidental line.

> ⛔ **Palm rejection: a pen beats touch, always.** Writing with a stylus means
> resting a hand on the page, and that hand is a second pointer. Without this
> rule a palm would either draw a line or — far worse — trigger the eraser and
> wipe the work. While a pen is down, every touch is ignored outright, and a
> pen arriving mid-touch takes the page over rather than blending two inputs.

### Clearing

One control, bottom **right**: *Double tap to clear*. Double-tap guarded like
the `⌂` and the `×`, because wiping a page somebody has just filled is the only
destructive thing in the section and a stray palm must not be able to do it.
Bottom right puts it as far from the `⌂` as the screen allows, so the two adult
controls cannot be confused.

Clearing deliberately **does not reset the colour** — the next stroke carries on
from the ink that was in use. Snapping back to black would make a wipe feel like
a different activity starting rather than a fresh page in the same one.

### Implementation notes

- **Its own canvas.** The tracing canvas repaints itself from glyph geometry on
  every `pointermove` — that is how the guide and the marker stay in register —
  and a page that must simply *keep* what was drawn on it is the opposite
  requirement. Sharing one canvas would have meant teaching `draw()` not to
  draw.
- **Strokes are appended, never repainted.** Each `pointermove` strokes only the
  new segment onto the canvas, so a long session stays cheap no matter how much
  ink is on the page. The stroke list is kept only so a **resize can repaint** —
  a tablet rotating mid-session must not wipe what someone has written.
- **A tap with no movement still makes a mark**, or the dot on an `i` would
  simply not appear.
- **`pointerup` and `pointercancel` only** — not `pointerleave`, which can fire
  on a captured pointer that slides past the edge and would end a stroke, and
  change the colour, with the finger still down.
- **Nothing is kept.** Leaving the section discards the page. There is no
  storage, no export and no history, exactly as in the assessment.

### Tests

`node tools/write-tests/run.mjs` — 74 assertions, no framework and no install.
It loads `index.html` under a small DOM stub and drives **real pointer events
through the real handlers**, so it covers the things that actually broke while
this was being written: a `const` used before its declaration, a second finger
hijacking a stroke, and a wrong-pointer `pointerup` ending one early.

Two suites run: `test_write.mjs` (the playground) and `test_sightwords.mjs`
(the word bank). The last assertion in the second one is the one worth
knowing about, because it guards a gap nothing else could see:

> **The word list is JavaScript and the dot sizing is CSS, and nothing
> connected them.** A word needing a cell count the stylesheet had never heard
> of would have rendered with no dot sizing at all — on the tablet, not in a
> test. That assertion walks every word in both conventions, collects every
> cell count the bank can actually produce, and fails if any of them is
> missing a `--d` rule in either round. Deleting one `cells-7` line makes it
> fail by name, which is how it was checked.

It also asserts that `audio/sight/<word>.wav` exists for every word in the
bank, so adding a word without recording it fails here too.

The deck is checked over **300 shuffles**, not one: that a round-2 card never
precedes its own round-1 card, that the first card is always round 1, and that
every word contributes exactly one card of each kind. Both rounds are then
dealt through the **real `setupItem`**, which is what proves a round-2 card
lays out no print and a seven-cell word builds seven cells.

## Assessment

**A sitting, not an activity.** Nothing is taught, nothing advances by itself,
and the student cannot move through it — every step is the assessor's. It is
reached by **double-tapping the small `assess` pill directly below the `⌂`**,
which is live both on the activity menu and inside an activity.

It is deliberately not a sixth menu card. A card can be picked by a student
working through the menu, and an assessment started by accident is a wasted
sitting; the double tap is the same guard the `⌂` uses, for the same reason.

### Two kinds of round, and the picker

The double tap no longer starts a round. It opens a **picker** — *Braille
letters* (26 cards) or *Print words* (35) — and the round begins on the one
chosen. The counts on the buttons are filled from the lists themselves, so they
cannot drift from what a round actually deals.

The picker is the one screen in the assessment that is **openly an adult's**:
full contrast, real button sizes, plain words, and a **single** tap, because the
double tap on the pill has already happened. Nobody is being assessed while it
is up, so none of the restraint the rest of the section shows applies to it.

It costs the braille round one extra tap. That is the price of not guessing: a
round started by accident is a wasted sitting either way, and the picker also
leaves room for a third kind later without another pill in the corner.

### The visual round — print words, no braille

The same thirty-five words the High Frequency Words activity teaches, by reference
and not by copy: **adding a word to `SIGHT_WORDS` adds it to both.** There is no
braille cell, nothing to tap, and nothing to get wrong on the screen. The
student reads the word aloud; the assessor marks it.

The word is drawn from the app's own centerlines, so it is the same school
print — single-story `a` — the student traces and reads everywhere else, and it
is **as big as the screen allows**. There is deliberately **no frame**: the
rectangle round the braille cell exists because six loose dots read as six
separate things, and a word already reads as one thing. A frame here would only
be another edge competing for the space the letters are meant to fill.

**The letters are never kerned or stretched to fit.** The SVG carries
`preserveAspectRatio="xMidYMid meet"`, so the glyph scales and the spacing
between letters scales with it; whatever is left over is empty margin. That is
the whole difference between filling a box and distorting a word to match one.

Each word fills its own box, so a word with no ascender or descender renders
larger than one with both — the viewBox is that word's own ink. This is the
same rule the High Frequency Words print row already follows.

> **⛔ Reserving the panel's width is what keeps the word off it, and two
> earlier attempts were wrong.** Recorded because both are tempting.
>
> **Attempt 1 — reserve nothing.** The argument: a word can only reach that
> corner by being *wide*, and a wide word must be *short*, because the viewBox
> is its own ink. True, and useless: a word whose aspect ratio matches the box
> fills **both** dimensions. `and` and `you` are 2.29 against a box of 2.28, and
> **six of thirteen words** put ink in the panel's band at 1280×800.
>
> **Attempt 2 — cap the height** to the panel's measured band, giving
> `min(66vh, calc(100vh − 414px))`. Correct at 1280×800, broken everywhere else:
> an absolute subtrahend does not scale, so a short viewport loses the lot.
>
> | viewport | word height under attempt 2 |
> | --- | --- |
> | 1366×768 laptop, maximised | 246px |
> | same at 125% display scaling | 114px |
> | same at 150% | **26px** |
> | phone **landscape** 915×412 | **negative — the word vanishes** |
>
> **What ships instead: reserve the width.** The stage is 94vw, the word is
> centred on the screen, and it gives back the panel's width plus a gap on each
> side — so the guarantee is arithmetic, not measured:
>
> ```
> left edge − panel right = 0.03vw + 11px     (positive at every size)
> ```
>
> The height is then a plain proportion, `min(66vh, 560px)`. Nothing needs
> re-deriving when the panel's *contents* change, because only its **width** is
> involved and that is `--apanelW`, shared with the panel itself.
>
> It costs width on a big screen and buys a word that is legible on every
> screen rather than optimal on one. Measured x-heights: **363px** on the
> laptop (was 205), **242px** at 150% scaling (was 22), **227px** in phone
> landscape (was nothing at all).

Below 900px the panel is a bottom strip instead, so the word gives back that
80px band rather than the top one.

#### Carl's two lines

Carl frames each card with *"Let's look at these print letters together and read
this word."* — and, as in the braille round, **does not read the word**, because
reading it is the thing being assessed.

When the assessor marks the card, Carl says *"Let's do the next one."* It fires
on the **mark**, not on *Next*, and it is guarded twice:

- **Silent when a tap clears a mark.** Clearing is the assessor correcting
  themselves, and announcing it would say something about the answer — the same
  reasoning that stops **Back** replaying the prompt.
- **Once per card.** A mis-tap and its correction do not make Carl repeat
  himself. Only a freshly presented card re-arms the line, so going **Back** does
  not re-arm it either.

Neither line says whether the answer was right. Carl announces; he never
evaluates. The braille round is unchanged and still has only its one prompt.

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

### A round is 26 letters or 35 words, and can end anywhere

The order is reshuffled every round. **Finish** ends it wherever it has got to
and still gives the snapshot — a short sitting is a real outcome, not an
abandoned one.

### The snapshot

Letters known, letters needing practice, a percentage, and the letters still to
work on in a readable typeface at a readable size — this is a list for an adult
to copy down, so it is typeset, not taught, and it reads alphabetically rather
than in the random order they were shown.

**It says which it counted.** After a word round the labels read *words known*
and `9 of 35 words marked`, because a page whose entire purpose is being copied
onto paper must not leave the reader guessing what the number is out of. The
list sorts case-insensitively, since a plain sort by code unit would file `I`
ahead of every lowercase word.

The percentage is **out of what was actually judged**, not out of the full
round, because Finish is allowed to end a round early and scoring the letters nobody got to as
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
(**0.4**), fading in and out over 900 ms. It keeps playing through the snapshot
and stops when the section closes.

The level was **set by ear on the classroom tablet**, which is the only place
that counts. It shipped at 0.18 first, which was a reasonable number on paper
and simply too quiet in the room.

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
- `?mode=write` (or `?mode=draw`) opens the writing playground.
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
  assessor does not have to enter a drill in order to leave it. It opens a
  **picker** — braille letters or print words — rather than starting a round.
  See *Assessment*.
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
| The still hold after the praise, then the fade | `SIGHT_HOLD_MS`, `SIGHT_FADE_MS` |
| The round-2 cell frame | the `outline` on `body.sightLook #braille .cell` |
| Assessment background music level | `ASSESS_MUSIC_LEVEL` |
| How fast that music fades in and out | `ASSESS_MUSIC_FADE` |
| Assessment cell size | `--ad` on `#assessCell` |
| Assessment print-word size | `--awordH` on `#assessWord`; the panel reserve is `--apanelW` |
| Which words the visual round asks | `ASSESS_WORDS`, which *is* `SIGHT_WORDS` |
| Print letter size in its box | `--boxSize` on `#boxes` |
| Which break activity runs | `breakRotation` |
| The writing playground's ink | `WRITE_INK` (declared beside `COLOR_PAIRS`) |
| Its stroke weight | `WRITE_WIDTH_FRAC` / `_MIN` / `_MAX` |
| Whether it makes any sound | `WRITE_BRUSH` — **on** since 2026-10-28 |
| How big the eraser is | `WRITE_ERASER_MULT` |
| What still counts as a two-finger gesture | `WRITE_ERASE_GRACE`, `WRITE_ERASE_SLOP` |

The Rhythm section has its own table of dials — see *The rhythm section · Tuning dials*.
