// The piano brain break: the keyboard it builds, the demonstration, and the
// rule that advances it - as many taps as the melody has notes, right or
// wrong. Timers are faked after load so the ~10 s demonstration runs in no
// time and every step can be checked at the moment it happens.
import { loadApp } from './dom.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(HERE, '..', '..', 'index.html');
let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log('  ok   ' + msg))
                                 : (fail++, console.log('  FAIL ' + msg)); };

loadApp(HTML, `
  globalThis.__P = { PIANO_SONGS, noteMidi, pianoRange, midiIsBlack, startPianoBreak, pianoPress,
                     goHome, pianoActive,
                     get count() { return pnCount; }, get turn() { return pnTurn; },
                     get keys() { return pnKeys; }, el: pianoEl,
                     get breakRotation() { return breakRotation; },
                     consts: { PIANO_LEAD_MS, PIANO_HANDOVER_MS, PIANO_DONE_MS } };
`);
const P = globalThis.__P;

// A fake clock, installed only now, so loading the app used the real one.
let now = 0, nextId = 1; const q = new Map();
globalThis.setTimeout = (fn, ms = 0) => { const id = nextId++; q.set(id, { fn, at: now + ms }); return id; };
globalThis.clearTimeout = id => { q.delete(id); };
function advance(ms) {
  const end = now + ms;
  for (;;) {
    let best = null;
    for (const [id, t] of q) if (t.at <= end && (!best || t.at < best[1].at)) best = [id, t];
    if (!best) break;
    q.delete(best[0]); now = best[1].at; best[1].fn();
  }
  now = end;
}

const song = P.PIANO_SONGS[0];
const N = song.notes.length;
const beat = 60000 / song.bpm;
const demoMs = P.consts.PIANO_LEAD_MS + song.notes.reduce((t, [, b]) => t + b * beat, 0)
             + P.consts.PIANO_HANDOVER_MS;

console.log('\n  -- notes and range --');
ok(P.noteMidi('A4') === 69 && P.noteMidi('C#5') === 73 && P.noteMidi('Bb4') === 70, 'note names map to MIDI');
ok(song.notes.map(([n]) => n).join(' ') === 'F#5 A5 G5 F#5 C#5 B4 C#5 D5 A4',
   'the Gymnopedie phrase is F# A G F# C# B C# D A');
const [lo, hi] = P.pianoRange(song);
ok(lo === 69 && hi === 81, 'the keyboard is A4..A5, the melody\'s own span');
ok(!P.midiIsBlack(lo) && !P.midiIsBlack(hi), 'and starts and ends on white keys');

console.log('\n  -- the demonstration --');
let finished = 0;
P.startPianoBreak(() => finished++);
const keys = P.keys;
const whites = [...keys.values()].filter(k => k.className.includes('white')).length;
const blacks = [...keys.values()].filter(k => k.className.includes('black')).length;
ok(whites === 8 && blacks === 5, `eight white keys and five black (${whites}/${blacks})`);
ok(song.notes.every(([n]) => keys.has(P.noteMidi(n))), 'every melody note has a key');
ok(keys.get(73).style.left.startsWith('calc(3 * 100% / 8'), 'C# sits on the C|D boundary');
ok(P.el.classList.contains('on') && P.el.classList.contains('ghost'), 'it opens ghosted');
P.pianoPress(78);
ok(P.count === 0, 'a tap during the demonstration does nothing');
advance(P.consts.PIANO_LEAD_MS + 1);
ok(keys.get(78).classList.contains('lit'), 'the first demo note lights its key (F#5)');
advance(demoMs - P.consts.PIANO_LEAD_MS - 50);
ok(P.el.classList.contains('ghost') && !P.turn, 'still ghosted until the last note has its full length');
advance(100);
ok(!P.el.classList.contains('ghost') && P.turn, 'then the keys come up for the student');
ok(keys.get(78).classList.contains('next'), 'and the guide dot is on F#5');
ok([...keys.values()].filter(k => k.classList.contains('next')).length === 1, 'on one key only');

console.log('\n  -- the student\'s turn: the count advances, not correctness --');
P.pianoPress(60);
ok(P.count === 0, 'a key that is not on the keyboard is ignored');
P.pianoPress(71);   // wrong: B4 instead of F#5
ok(P.count === 1, 'a wrong note still counts');
ok(keys.get(81).classList.contains('next') && !keys.get(78).classList.contains('next'),
   'and the guide moves on to the melody\'s second note (A5)');
for (let i = 1; i < N - 1; i++) P.pianoPress(69);
ok(P.count === N - 1 && P.turn, `${N - 1} taps: still playing`);
P.pianoPress(69);
ok(P.count === N && !P.turn, `${N} taps: done, input closes`);
ok([...keys.values()].every(k => !k.classList.contains('next')), 'the guide is gone');
P.pianoPress(69);
ok(P.count === N, 'a tap after the end does nothing');
ok(finished === 0, 'the last note rings before the break hands back');
advance(P.consts.PIANO_DONE_MS + 10);
ok(finished === 1 && !P.pianoActive() && !P.el.classList.contains('on'), 'then it ends, once');

console.log('\n  -- walking out --');
let finished2 = 0;
P.startPianoBreak(() => finished2++);
advance(2000);
P.goHome();
advance(60000);
ok(finished2 === 0 && !P.pianoActive(), 'the home button mid-demo ends it without handing back');
ok(q.size === 0 || [...q.values()].every(t => t.at <= now), 'and leaves nothing scheduled');

export default { pass, fail };
