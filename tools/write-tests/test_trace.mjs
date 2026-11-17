// Letter and digit tracing: what counts as DONE. Real pointer events through
// the real trace-canvas handlers.
//
// Tracing was tightened on 2026-11-16: every stroke must now be covered end to
// end, with the finger on or just beside the ink. It used to pass at 70% of
// each stroke inside a halo of more than a guide width. These tests pin the new rule
// down from both sides - what must NOT pass any more, and what must still pass
// - plus the one promise the rule makes to the student: a guide that LOOKS
// painted over has counted.
//
// The DOM stub's SVG paths are fake, so the test installs its own glyph
// geometry: a straight vertical line, where "distance from the guide" is just
// a horizontal offset and every number below is exact.
import { loadApp } from './dom.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.html');

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log('  ok   ' + msg))
                                 : (fail++, console.log('  FAIL ' + msg)); };

const { listeners } = loadApp(HTML, `
  globalThis.__R = {
    TRACE_HALO, TRACE_COVERAGE,
    // A test glyph: vertical strokes sampled every 2 units, like the real
    // sampler. 'l' is one 100-unit stem; 'i' is a dot over a 70-unit stem.
    install() {
      const line=(x,y0,y1)=>{ const n=Math.ceil(Math.abs(y1-y0)/2);
        return Array.from({length:n+1},(_,k)=>[x,y0+(y1-y0)*k/n]); };
      GLYPHS.l=[line(0,-30,70)];
      GLYPHS.i=[[[0,-24],[0,-23.9]], line(0,0,70)];
      for (const ch of ['l','i']) {
        const pts=GLYPHS[ch].flat(), xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
        GLYPH_BOUNDS[ch]={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
      }
    },
    deal(ch) { mode='letters'; order=[ch]; orderIndex=0; runId++; advancing=false; setupItem(); },
    geometry: () => currentGeometry(),
    guideWidth: () => currentTransform().guideWidth,
    radius: () => coverageRadius(),
    done: () => traceDone,
    advancing: () => advancing,
    brailleDone() { for (const c of cells) c.done=true; checkCompletion(); },
  };
`);
const R = globalThis.__R;
const C = listeners['traceCanvas'];
R.install();

const ev = (x, y) => ({ pointerId: 1, clientX: x, clientY: y, pointerType: 'touch', preventDefault() {} });
// One continuous finger-down along the given screen points.
function drag(pts) {
  C.pointerdown(ev(...pts[0]));
  for (const p of pts.slice(1)) C.pointermove(ev(...p));
  C.pointerup(ev(...pts[pts.length - 1]));
}
const shifted = (pts, dx) => pts.map(([x, y]) => [x + dx, y]);

ok(!!C && !!C.pointerdown && !!C.pointermove && !!C.pointerup,
   'the trace canvas has down/move/up handlers bound');

console.log('\n  -- the dials --');
ok(R.TRACE_COVERAGE === 1, 'every stroke must be traced completely (coverage 1)');
R.deal('l');
const gw = R.guideWidth();
ok(R.radius() < gw, `the halo is under a guide width (${(R.radius() / gw).toFixed(2)})`);
ok(R.radius() > gw * .76 / 2,
   'THE PROMISE: the halo is wider than half the marker, so a guide that looks painted over has counted');

console.log('\n  -- what no longer passes --');
let stem = R.geometry()[0];
R.deal('l'); drag(stem.slice(0, Math.floor(stem.length * .8)));
ok(!R.done(), 'tracing 80% of the stroke is NOT done (it used to be)');
R.deal('l'); drag(stem.slice(Math.ceil(stem.length * .1), Math.floor(stem.length * .9)));
ok(!R.done(), 'skipping both ends of the stroke is NOT done');
R.deal('l'); drag(shifted(stem, gw * 1.0));
ok(!R.done(), 'a full-length swipe one guide width off the line is NOT done');
R.deal('l'); drag(shifted(stem, gw * 0.9));
ok(!R.done(), 'nor at 0.9 guide widths off');

console.log('\n  -- what still passes --');
R.deal('l'); drag(stem);
ok(R.done(), 'tracing the whole stroke on the line is done');
R.deal('l'); drag(shifted(stem, gw * .4));
ok(R.done(), 'a full trace a little off-centre (marker still overlaps the guide) is done');
R.deal('l');
const half = Math.floor(stem.length / 2);
drag(stem.slice(0, half)); drag(stem.slice(half - 1));
ok(R.done(), 'lifting off and finishing in a second go is done - coverage accumulates');
R.deal('l'); drag([...stem].reverse());
ok(R.done(), 'direction does not matter (bottom-up counts)');

console.log('\n  -- i/j: the dot is touched, the stem is traced --');
R.deal('i');
let [dot, iStem] = R.geometry();
drag(iStem);
ok(!R.done(), 'the stem alone is NOT done');
C.pointerdown(ev(dot[0][0] + gw * 1.2, dot[0][1])); C.pointerup(ev(dot[0][0] + gw * 1.2, dot[0][1]));
ok(!R.done(), 'a tap well beside the dot does not count');
C.pointerdown(ev(...dot[0])); C.pointerup(ev(...dot[0]));
ok(R.done(), 'a tap ON the dot completes it');

console.log('\n  -- tracing gates advancing --');
R.deal('l');
drag(stem.slice(0, Math.floor(stem.length * .8)));
R.brailleDone();
ok(!R.advancing(), 'braille done + tracing incomplete: it does NOT advance');
drag(stem);
ok(R.advancing(), 'finishing the trace is what lets it advance');

export default { pass, fail };
