// Print Letter Tracing: the picker, the round, the shared tracing rule, the
// reward round, the ink-per-round rule and the "pick new letters" pill. Real
// handlers, real pointer events.
//
// The DOM stub's SVG paths are fake, so the test installs its own glyphs:
// straight vertical strokes, where every distance below is exact.
import { loadApp } from './dom.mjs';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.html');

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log('  ok   ' + msg))
                                 : (fail++, console.log('  FAIL ' + msg)); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const { listeners, missingIds } = loadApp(HTML, `
  globalThis.__P = {
    clips: [],
    install() {
      const line=(x,y0,y1)=>{ const n=Math.ceil(Math.abs(y1-y0)/2);
        return Array.from({length:n+1},(_,k)=>[x,y0+(y1-y0)*k/n]); };
      GLYPHS.l=[line(0,-30,70)];
      GLYPHS.i=[[[0,-24],[0,-23.9]], line(0,0,70)];
      GLYPHS.t=[line(0,-25,70), [[ -20,0],[-10,0],[0,0],[10,0],[20,0]]];
      for (const ch of ['l','i','t']) {
        const pts=GLYPHS[ch].flat(), xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
        GLYPH_BOUNDS[ch]={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
      }
    },
    start, goHome, openPrintPicker, printPick, printUnpick,
    active: () => pOn, letters: () => pLetters, layout: () => pLayout,
    geometry: () => pGeometry(), advancing: () => pAdvancing,
    ink: () => printInk(), segments: () => pSegments.length,
    letterDone: (i) => printLetterDone(i),
    slots: () => [...pickSlots], goDisabled: () => printGo.disabled,
    chooserOn: () => chooser.classList.contains('on'),
    panelShown: () => !printPanel.hidden, modesShown: () => !chooserModesRow.hidden,
    bodyMode: () => document.body.classList.contains('mode-print'),
    mgOn: () => minigameActive(), endMinigame: () => endMinigame(),
    pianoOn: () => pianoActive(), endPiano: () => endPiano(),
    mgTune: () => mgTune, TUNES,
  };
  // Every clip the app tries to play or warm while in this section. There
  // must be none: no letter sounds, only the brush.
  const __clip=clip, __play=playClip;
  clip=(src)=>{ globalThis.__P.clips.push(src); return __clip(src); };
  playClip=(src,cb)=>{ globalThis.__P.clips.push(src); return __play(src,cb); };
`);
const P = globalThis.__P;
const C = listeners['printCanvas'];
P.install();

const html = fs.readFileSync(HTML, 'utf8');
const ev = (x, y, id = 1) => ({ pointerId: id, clientX: x, clientY: y, pointerType: 'touch', preventDefault() {} });
function drag(pts) {
  C.pointerdown(ev(...pts[0]));
  for (const p of pts.slice(1)) C.pointermove(ev(...p));
  C.pointerup(ev(...pts[pts.length - 1]));
}
const traceLetter = i => { for (const st of P.geometry()[i]) drag(st); };

console.log('\n  -- load and menu --');
ok(missingIds.length === 0, 'every getElementById target exists' +
   (missingIds.length ? ' (missing: ' + [...new Set(missingIds)].join(', ') + ')' : ''));
ok(!!C && !!C.pointerdown && !!C.pointermove && !!C.pointerup, 'the print canvas has down/move/up bound');
const order = [...html.matchAll(/<button class="card"[^>]*data-mode="([^"]+)"/g)].map(m => m[1]);
ok(order.indexOf('print') === order.indexOf('write') + 1, `the card sits right after Write (${order.join(', ')})`);
ok(/data-mode="print"[^>]*>[\s\S]*?<span>Print Letter Tracing<\/span>/.test(html), 'it is called "Print Letter Tracing"');

console.log('\n  -- the picker --');
P.openPrintPicker('menu');
ok(P.panelShown() && !P.modesShown(), 'tapping the card shows the picker in place of the card row');
ok(P.goDisabled(), 'Start is disabled with nothing picked');
P.printPick('t'); P.printPick('i');
ok(P.goDisabled(), 'and with two');
P.printPick('l');
ok(!P.goDisabled(), 'three picked: Start is live');
ok(P.slots().join('') === 'til', 'slots fill in the order tapped');
P.printPick('x');
ok(P.slots().join('') === 'til', 'a fourth pick is ignored');
P.printUnpick(1); ok(P.goDisabled(), 'emptying a slot disables Start');
P.printPick('l'); ok(P.slots().join('') === 'tll', 'the next pick fills the emptied slot - repeats allowed');
P.printUnpick(1); P.printPick('i');

listeners['printGo'].click();
ok(P.active() && P.bodyMode(), 'Start enters the section');
ok(P.letters().join('') === 'til', 'with the three picked letters, in order');
ok(!P.chooserOn() && P.modesShown() && !P.panelShown(), 'the menu is gone and reset behind it');

console.log('\n  -- layout: as big as it goes, nothing overlapping --');
const L = P.layout();
const geo = P.geometry();
const xr = geo.map(strokes => { const xs = strokes.flat().map(p => p[0]); return [Math.min(...xs), Math.max(...xs)]; });
ok(L.asRow, 'a wide screen lays the three out in a row');
ok(xr[0][1] < xr[1][0] && xr[1][1] < xr[2][0], 'left to right, no letter overlapping the next');
const ys = geo.flat(2).map(p => p[1]);
ok(Math.min(...ys) - L.gw / 2 >= 64 - 1 && Math.max(...ys) + L.gw / 2 <= 600 - 60 + 1,
   'the ink clears the ⌂ at the top and the pill at the bottom');
ok(Math.abs((Math.max(...ys) - Math.min(...ys)) + L.gw - (600 - 64 - 60)) < 1,
   'and fills the whole free height - the letters are as large as the page allows');

console.log('\n  -- the same rule as braille Letters --');
const inkAtStart = P.ink();
const stem = geo[0][0];
drag(stem.slice(0, Math.floor(stem.length * .8)));
ok(!P.letterDone(0), '80% of a stroke is not a traced letter');
drag(stem);
ok(!P.letterDone(0), 'the stem of a t without its crossbar is not traced');
drag(geo[0][1]);
ok(P.letterDone(0), 'stem + crossbar: the t is traced');
ok(!P.advancing(), 'one letter of three does not end the round');
drag(geo[1][1]);
ok(!P.letterDone(1), 'the i without its dot is not traced');
C.pointerdown(ev(...geo[1][0][0])); C.pointerup(ev(...geo[1][0][0]));
ok(P.letterDone(1), 'touching the dot finishes the i');
drag(geo[2][0].map(([x, y]) => [x + L.gw * 1.0, y]));
ok(!P.letterDone(2), 'a swipe a guide width beside the l does not count');
ok(P.ink() === inkAtStart, 'the ink has not changed across five strokes - one colour per round');
ok(!P.advancing(), 'two of three: still no reward');

console.log('\n  -- finishing a round --');
traceLetter(2);
ok(P.advancing(), 'tracing the third letter finishes the round');
await wait(700);
ok(P.pianoOn() && !P.mgOn(), 'and the PIANO break comes up, not the shape reward round');
P.endPiano();
ok(P.active() && !P.advancing(), 'after it, the section carries on');
ok(P.letters().join('') === 'til', 'with the SAME three letters');
ok(P.segments() === 0 && [0, 1, 2].every(i => !P.letterDone(i)), 'on a clean page');
ok(P.ink() !== inkAtStart, 'in a NEW ink colour');
ok(P.clips.length === 0, 'and no clip was played or warmed at any point - only the brush' +
   (P.clips.length ? ` (${P.clips})` : ''));

console.log('\n  -- pick new letters --');
const pill = listeners['printNew'];
ok(!!pill && !!pill.pointerup, 'the pill is wired');
pill.pointerup({ preventDefault() {} });
ok(!P.chooserOn(), 'ONE tap does nothing but arm it');
await wait(700);
pill.pointerup({ preventDefault() {} }); pill.pointerup({ preventDefault() {} });
ok(P.chooserOn() && P.panelShown() && !P.modesShown(), 'a double tap brings the picker back');
ok(P.slots().every(s => s === null), 'with empty slots');
listeners['printBack'].click();
ok(!P.chooserOn() && P.active() && P.letters().join('') === 'til',
   'Back returns to the same letters');
const inkBefore = P.ink();
pill.pointerup({ preventDefault() {} }); pill.pointerup({ preventDefault() {} });
P.printPick('l'); P.printPick('l'); P.printPick('t');
listeners['printGo'].click();
ok(P.active() && P.letters().join('') === 'llt', 'picking new letters starts them');
ok(P.ink() !== inkBefore, 'and a new round is a new colour');

console.log('\n  -- a finished round cut short by the picker --');
for (let i = 0; i < 3; i++) traceLetter(i);
ok(P.advancing(), 'round finished');
pill.pointerup({ preventDefault() {} }); pill.pointerup({ preventDefault() {} });
await wait(700);
ok(!P.pianoOn() && !P.mgOn(), 'opening the picker in the pause cancels the pending piano break');
listeners['printBack'].click();
ok(!P.advancing() && P.segments() === 0, 'and Back carries on with a fresh round');

console.log('\n  -- leaving --');
P.goHome();
ok(!P.active(), 'the ⌂ leaves the section');
ok(P.modesShown() && !P.panelShown(), 'and the menu shows its cards, not the picker');

export default { pass, fail };
