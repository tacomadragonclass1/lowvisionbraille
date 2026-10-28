// The write playground. Real pointer events through the real handlers.
import { loadApp } from './dom.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.html');

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log('  ok   ' + msg))
                                 : (fail++, console.log('  FAIL ' + msg)); };

const { listeners, missingIds } = loadApp(HTML, `
  globalThis.__T = { start, writeActive, writeWipe, endWrite, WRITE_INK,
                     strokes: () => wStrokes, ink: () => wInk,
                     hintGone: () => writeHint.classList.contains('gone') };
`);
const T = globalThis.__T;
const C = listeners['writeCanvas'];

// Load-time guarantees. These are the ones that take the whole app down.
ok(missingIds.length === 0,
   'every getElementById target exists in the markup' +
   (missingIds.length ? ' (missing: ' + [...new Set(missingIds)].join(', ') + ')' : ''));
ok(!!C && !!C.pointerdown && !!C.pointermove && !!C.pointerup,
   'the write canvas has down/move/up handlers bound');

const ev = (id, x, y) => ({ pointerId: id, clientX: x, clientY: y, preventDefault() {} });
function stroke(id, pts) {
  C.pointerdown(ev(id, pts[0][0], pts[0][1]));
  for (const p of pts.slice(1)) C.pointermove(ev(id, p[0], p[1]));
  C.pointerup(ev(id, ...pts[pts.length - 1]));
}

T.start('write', null);
ok(T.writeActive() === true, 'start("write") enters the section');
ok(T.strokes().length === 0, 'it opens on a blank page');
ok(T.hintGone() === false, 'the hint shows before the first stroke');

stroke(1, [[10, 10], [40, 50], [90, 70]]);
ok(T.strokes().length === 1, 'a stroke is recorded');
ok(T.strokes()[0].color === T.WRITE_INK[0], 'the first stroke uses ink 0');
ok(T.strokes()[0].pts.length === 3, 'every point of it is kept');
ok(T.hintGone() === true, 'the hint clears once something is drawn');

stroke(1, [[100, 10], [140, 50]]);
ok(T.strokes()[1].color === T.WRITE_INK[1], 'THE FEATURE: lifting off changes the ink');
ok(T.strokes()[0].color !== T.strokes()[1].color, 'consecutive strokes never share a colour');

C.pointerdown(ev(2, 200, 200)); C.pointerup(ev(2, 200, 200));
ok(T.strokes().length === 3, 'a tap with no movement still makes a mark');
ok(T.strokes()[2].pts.length === 1, 'and that mark is a single point (the dot on an i)');

const inkAtCycleStart = T.ink();
for (let i = 0; i < T.WRITE_INK.length; i++) stroke(3, [[i * 5, 300], [i * 5 + 20, 320]]);
ok(T.ink() === inkAtCycleStart, `the palette wraps after ${T.WRITE_INK.length} lifts`);
ok(new Set(T.strokes().slice(-T.WRITE_INK.length).map(s => s.color)).size === T.WRITE_INK.length,
   'one full cycle uses every ink exactly once');

// Multi-touch. A second finger must not be able to hijack or end a stroke.
const n = T.strokes().length;
C.pointerdown(ev(9, 400, 400));
C.pointermove(ev(7, 999, 999));
ok(T.strokes()[T.strokes().length - 1].pts.length === 1,
   'a move from a different pointer is ignored mid-stroke');
const inkMid = T.ink();
C.pointerup(ev(7, 999, 999));
ok(T.ink() === inkMid, 'a wrong-pointer release does not end the stroke or change the ink');
C.pointerup(ev(9, 400, 400));
ok(T.strokes().length === n + 1 && T.ink() !== inkMid, 'the right pointer does end it');

const inkBeforeWipe = T.ink();
T.writeWipe();
ok(T.strokes().length === 0, 'clear wipes the page');
ok(T.ink() === inkBeforeWipe, 'clear deliberately keeps the current ink');
ok(T.hintGone() === false, 'the hint returns on a cleared page');

T.endWrite();
ok(T.writeActive() === false, 'endWrite leaves the section');
ok(T.strokes().length === 0, 'nothing is kept after leaving');

T.start('letters', null);
ok(T.writeActive() === false, 'switching to another activity does not re-enter it');

export default { pass, fail };
