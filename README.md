# Low Vision Braille — trace + braille alphabet

A single-file, offline web app for a low-vision student learning print letter
formation alongside the braille alphabet. Open `index.html` — there is no build
step, no dependency, and no network call.

**Live:** https://tacomadragonclass1.github.io/lowvisionbraille/

Designed for a tablet in landscape, full screen, held in two hands.

## How a letter works

1. A large letter guide is drawn on the left. The student traces it with a finger.
   Tracing is deliberately loose: a generous halo around the thick guide counts,
   and a stroke is satisfied at 70% coverage (18% for the dots on `i` and `j`).
2. The braille cell on the right lights the dots required for that letter.
   The student touches each one.
3. **Both** are required to advance — a traced letter alone will not move on,
   and neither will the dots alone.

## Starting a session

The app opens on a **Tap to start** screen: a large pulsing yellow circle on
black. Tapping anywhere answers with a rising C-E-G chime and begins.

This is not decoration. Browsers refuse to start audio without a user gesture,
so without the gate the first dot or stroke of a session would be silent and
read as broken. The splash absorbs that unlocking touch, and the chime doubles
as proof to the adult in the room that sound is working.

## Sound

| Event | Sound |
| --- | --- |
| Finger on the letter guide | A brush-stroke swoosh, continuous while tracing |
| Finger off the guide, or lifted | Buzz stops immediately |
| Braille dot touched | That dot's fixed tone |
| Shape touched in the minigame | A pop, then one note of the tune |

The brush follows the **finger**, not the gesture: wander off the guide and it
drops out, come back and it returns, with no restart gap.

It is pink noise through a bandpass that **opens as the finger moves faster** —
a slow careful trace is a dark quiet whisper (~700 Hz), a confident sweep is a
bright loud swoosh (~3300 Hz). Resting a finger on the line settles it to a
quiet hiss rather than cutting out, so he can still hear that he is on the line.

### Braille dot tones — C major, one tone per position

The mapping never changes. Position is what the student learns to hear.

| Dot | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Note | C4 | D4 | E4 | F4 | G4 | A4 |

Left column top-to-bottom is C–D–E; right column top-to-bottom is F–G–A.
Every dot sounds, required or not, so exploring the cell is always audible.

## The shape minigame

After every 4th completed letter, a reward round plays the first seven notes of
*Mary Had a Little Lamb* (**mi re do re mi mi mi**).

One bright shape appears at a time, each further to the right than the last.
Touching it pops it and plays its note, then the next appears. After the seventh
note the app returns to tracing.

Shapes and colours are redrawn at random every round from the standard
kindergarten set — circle, square, triangle, rectangle, oval, diamond, star,
heart, hexagon. **The flow and the notes never change:** always left to right,
always the same seven notes.

## Options

- `?letter=k` — lock the app to a single letter for targeted practice.
  Without it, the alphabet is shuffled and cycles.
- The *Full screen* button hides browser chrome. The small `×` at the top right
  exits on a double tap, so it is hard to hit by accident.
