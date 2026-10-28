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
                     WRITE_BRUSH, WRITE_ERASE_GRACE, WRITE_ERASE_SLOP,
                     strokes: () => wStrokes, ink: () => wInk,
                     mode: () => wMode,
                     erasing: () => !writeEraser.hidden,
                     resize: () => writeResize(),
                     hintGone: () => writeHint.classList.contains('gone'),
                     brushLog: [] };
  // Wrap the brush so the test can see the UNITS it is fed - the first version
  // of this handler passed a raw distance where px/ms was wanted.
  const __bs = brushSpeed;
  brushSpeed = (v) => { globalThis.__T.brushLog.push(v); return __bs(v); };
`);
const T = globalThis.__T;
const C = listeners['writeCanvas'];

// Load-time guarantees. These are the ones that take the whole app down.
ok(missingIds.length === 0,
   'every getElementById target exists in the markup' +
   (missingIds.length ? ' (missing: ' + [...new Set(missingIds)].join(', ') + ')' : ''));
ok(!!C && !!C.pointerdown && !!C.pointermove && !!C.pointerup,
   'the write canvas has down/move/up handlers bound');

const ev = (id, x, y, type = 'touch') =>
  ({ pointerId: id, clientX: x, clientY: y, pointerType: type, preventDefault() {} });
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

// ---------------------------------------------------------------- the brush
console.log('\n  -- brush --');
T.start('write', null);
T.brushLog.length = 0;
ok(T.WRITE_BRUSH === true, 'the brush is on');
C.pointerdown(ev(1, 0, 0));
C.pointermove(ev(1, 30, 40));          // 50px
C.pointermove(ev(1, 90, 120));         // 100px
C.pointerup(ev(1, 90, 120));
ok(T.brushLog.length >= 2, 'the brush is fed on every move');
// brushSpeed normalises against 1.6 px/ms. A raw DISTANCE would arrive as
// 50-100 and peg it; a real rate over a floored >=6ms interval cannot exceed
// about 17 for these points, and in practice is far less.
const maxFed = Math.max(...T.brushLog);
ok(maxFed <= 100 / 6 + 0.001,
   `the brush is fed px/ms, not raw distance (max ${maxFed.toFixed(2)})`);
ok(T.brushLog.every(v => v >= 0 && Number.isFinite(v)), 'every value is finite and non-negative');

// ---------------------------------------------------------------- the eraser
console.log('\n  -- two-finger eraser --');
T.writeWipe();
ok(T.erasing() === false, 'the eraser icon is hidden to start with');

// two fingers, landing together: the first one's dot is part of the gesture
C.pointerdown(ev(1, 100, 100));
const afterFirst = T.strokes().length;
C.pointerdown(ev(2, 160, 100));
ok(T.mode() === 'erase', 'a second finger switches to erase');
ok(T.erasing() === true, 'the eraser icon appears');
ok(T.strokes().length === afterFirst - 1,
   'the half-started stroke is discarded, not left as a stray mark');

// wiping
const beforeWipe = T.strokes().length;
C.pointermove(ev(1, 200, 160));
C.pointermove(ev(2, 260, 160));
ok(T.strokes().length > beforeWipe, 'moving two fingers records erase marks');
ok(T.strokes().slice(-1)[0].kind === 'erase', 'they are recorded AS erases');

// one up: erase ends, and the finger still down must not start drawing
C.pointerup(ev(1, 200, 160));
ok(T.mode() !== 'erase', 'lifting to one finger ends the erase');
ok(T.erasing() === false, 'the eraser icon goes away');
const held = T.strokes().length;
C.pointermove(ev(2, 300, 300));
ok(T.strokes().length === held, 'the remaining finger does NOT start drawing');
C.pointerup(ev(2, 300, 300));
C.pointerdown(ev(3, 50, 50)); C.pointermove(ev(3, 80, 80)); C.pointerup(ev(3, 80, 80));
ok(T.strokes().slice(-1)[0].kind === 'ink', 'once every finger is up, drawing works again');

// a DELIBERATE stroke is not thrown away by a later second finger
T.writeWipe();
C.pointerdown(ev(1, 10, 10));
for (let i = 1; i <= 12; i++) C.pointermove(ev(1, 10 + i * 20, 10 + i * 10));
const drawn = T.strokes().length;
C.pointerdown(ev(2, 400, 400));
ok(T.mode() === 'erase', 'a second finger still starts the eraser');
ok(T.strokes().length === drawn, 'but a long, deliberate stroke is KEPT');
C.pointerup(ev(1, 0, 0)); C.pointerup(ev(2, 0, 0));

// erasing must survive a rotation
T.writeWipe();
C.pointerdown(ev(1, 20, 20)); C.pointermove(ev(1, 120, 120)); C.pointerup(ev(1, 120, 120));
C.pointerdown(ev(1, 60, 60)); C.pointerdown(ev(2, 80, 60));
C.pointermove(ev(1, 100, 100)); C.pointermove(ev(2, 120, 100));
const ops = T.strokes().filter(s => s.kind === 'erase').length;
C.pointerup(ev(1, 0, 0)); C.pointerup(ev(2, 0, 0));
T.resize();
ok(T.strokes().filter(s => s.kind === 'erase').length === ops,
   'erases are kept in the display list, so a rotation cannot undo them');

// ------------------------------------------------------------ palm rejection
console.log('\n  -- palm rejection --');
T.writeWipe();
C.pointerdown(ev(1, 100, 100, 'pen'));
const penStrokes = T.strokes().length;
C.pointerdown(ev(2, 300, 300, 'touch'));       // the heel of a hand
ok(T.mode() === 'draw', 'a touch landing while a PEN is down does not start the eraser');
ok(T.strokes().length === penStrokes, 'and it adds no mark of its own');
C.pointermove(ev(1, 150, 150, 'pen'));
ok(T.strokes().slice(-1)[0].kind === 'ink', 'the pen keeps drawing through it');
C.pointerup(ev(2, 300, 300, 'touch'));
C.pointerup(ev(1, 150, 150, 'pen'));
ok(T.mode() === 'idle', 'and everything settles when both come up');

// two fingers of the SAME kind still erase
T.writeWipe();
C.pointerdown(ev(1, 100, 100, 'touch'));
C.pointerdown(ev(2, 160, 100, 'touch'));
ok(T.mode() === 'erase', 'two touches do erase');
C.pointerup(ev(1, 0, 0)); C.pointerup(ev(2, 0, 0));
T.endWrite();

export default { pass, fail };
