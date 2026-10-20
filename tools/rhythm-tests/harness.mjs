// Runs the REAL rhythm module out of index.html against a virtual clock, with
// just enough DOM and Web Audio stubbed to let it breathe. Nothing in the
// module is rewritten: the plan, the scheduler, the cue loop, the judge, the
// verdict and the progression are all the shipped code.
// Runs the REAL rhythm brain break out of index.html against a virtual clock.
//
// Nothing here is a copy of the game: the module is sliced out of index.html at
// run time and executed with just enough DOM and Web Audio stubbed to let it
// breathe, so the plan, the scheduler, the cue loop, the judge, the verdict and
// the progression under test are the shipped code. There is deliberately no
// second copy of the scoring to drift out of step with the first.
//
// WHY THIS EXISTS AND NOT A BROWSER TEST
//   The game is about timing, and timing is the one thing a remote-controlled
//   browser cannot measure: a debugged tab throttles requestAnimationFrame to
//   ONE FRAME A SECOND (measured), so a robot tapping "on the beat" lands up to
//   a second late and every round scores zero. Here the clock is a variable and
//   a round takes milliseconds.
//
//   Run:  node tools/rhythm-tests/run.mjs
//
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_FILE = join(REPO, 'index.html');


export function loadModule() {
  const s = readFileSync(SRC_FILE, 'utf8');
  // Matched by SHAPE rather than by exact wording - a banner comment is a
  // heading, and headings get reworded. It still fails loudly if the section
  // is gone, which is the behaviour that matters: a slice that silently
  // grabbed the wrong region would test nothing and report success.
  const open = /^[ \t]*\/\/ ={5,} rhythm [^\n]*={3,}$/m.exec(s);
  const close = /^[ \t]*\/\/ -{5,} progression [^\n]*-{3,}$/m.exec(s);
  if (!open) throw new Error('rhythm section banner not found in index.html');
  if (!close) throw new Error('progression banner not found in index.html');
  if (close.index < open.index) throw new Error('banners out of order');
  return s.slice(open.index, close.index);
}

// ---- stubs -------------------------------------------------------------
function makeEl(id) {
  const cls = new Set();
  const history = [];
  let text = '';
  return {
    id, _rT:null, style:{}, history,
    get textContent(){ return text; },
    set textContent(v){ text = v; if (v) history.push(v); },
    classList:{
      add:(...c)=>c.forEach(x=>cls.add(x)),
      remove:(...c)=>c.forEach(x=>cls.delete(x)),
      toggle:(x,on)=>{ const want = on===undefined ? !cls.has(x) : Boolean(on);
                       if (want) cls.add(x); else cls.delete(x); return want; },
      contains:x=>cls.has(x),
      _set:cls
    },
    disabled:false,
    setAttribute(){}, animate(){ return {finished:Promise.resolve()}; },
    addEventListener(){},
  };
}

export function run(opts) {
  const { moduleSrc, player, maxSeconds = 900, onEvent } = opts;
  const log = [];
  const els = {};
  for (const id of ['rhythm','rhythmBand','rhythmBanner','rhythmBoom','rhythmClap'])
    els[id] = makeEl(id);

  let vt = 0;                      // the virtual AudioContext clock, seconds
  const scheduled = [];            // every drum/tick the band queued
  const audioCtx = {
    get currentTime(){ return vt; },
    sampleRate: 48000,
    state: 'running',
    baseLatency: 0, outputLatency: 0,
    getOutputTimestamp(){ return { contextTime: vt, performanceTime: vt*1000 }; },
    createGain(){ return node('gain'); },
    createOscillator(){ return node('osc'); },
    createBiquadFilter(){ return node('biquad'); },
    createBufferSource(){ return node('buf'); },
    createBuffer(c,n,sr){ return { getChannelData:()=>new Float32Array(n), length:n }; },
    createConvolver(){ return node('convolver'); },
    createWaveShaper(){ return node('shaper'); },
    resume(){ return Promise.resolve(); },
  };
  function param(){ const p={value:0}; for (const m of ['setValueAtTime','linearRampToValueAtTime',
    'exponentialRampToValueAtTime','setTargetAtTime','cancelScheduledValues']) p[m]=()=>p; return p; }
  function node(kind){
    const n={ kind, gain:param(), frequency:param(), Q:param(), detune:param(),
      type:'', buffer:null, curve:null, oversample:'',
      connect(x){ return x; }, start(t){ n._t=t; }, stop(){} };
    return n;
  }

  // Timers and frames are pumped by the driver below, never by real time.
  const timers = [];   // {fn, every}
  const frames = [];
  const clips = [];

  const sandbox = {
    document: {
      getElementById: id => els[id] || makeEl(id),
      addEventListener(){},
    },
    window: {},
    performance: { now: () => vt*1000 },
    console,
    audio: () => audioCtx,
    get audioCtx(){ return audioCtx; },
    masterGain: node('gain'),
    playClip: (src) => { clips.push({ t:+vt.toFixed(4), src }); },
    clip: () => ({ duration: NaN, load(){} }),
    brushOff(){},
    startBrainBreak(cb){ log.push({ t:vt, ev:'fellBackToCarl' }); cb && cb(); },
    setInterval: (fn, ms) => { timers.push({fn, ms}); return timers.length-1; },
    clearInterval: () => {},
    setTimeout: (fn, ms) => 0,
    clearTimeout: () => {},
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {},
  };

  const names = Object.keys(sandbox);
  const body = `"use strict";\n${moduleSrc}\nreturn { startRhythmBreak, startRhythmActivity, endRhythm, rhythmActive, api: window.__rhythm };`;
  const factory = new Function(...names, body);
  const mod = factory(...names.map(n => sandbox[n]));

  // ---- the driver ------------------------------------------------------
  // `breaks` runs that many consecutive breaks on the SAME module instance,
  // which is the only way to see what carries over between them.
  // `breaks` runs that many consecutive BREAKS (each one set, self-ending).
  // `activity` instead starts the rhythm section, which never ends on its own;
  // the driver stops when maxSeconds of virtual time have passed.
  // `activity` starts the section, which never ends on its own - the driver
  // stops after `runFor` virtual seconds. Otherwise the brain-break shape runs
  // and ends itself.
  let finished = false;
  if (opts.activity) mod.startRhythmActivity();
  else mod.startRhythmBreak(() => { finished = true; });

  const STEP = 1/120;              // 8.3 ms of virtual time per frame
  const taps = [];
  let guard = 0;
  while (!finished && vt < maxSeconds && guard++ < maxSeconds/STEP + 10) {
    if (opts.activity && vt >= (opts.runFor || maxSeconds)) break;
    vt += STEP;
    for (const t of timers) t.fn();            // the scheduler interval
    const due = frames.splice(0, frames.length);
    for (const f of due) f(0);                 // the cue loop
    if (finished) break;
    // The student, if a test wants one. Nothing it does is measured by the
    // game - a test drives it only to prove that tapping changes nothing.
    if (player) for (const h of player(vt, mod.api)) {
      taps.push({ t:+vt.toFixed(4), target:h });
      mod.api.tap(h);
    }
    if (onEvent) onEvent(vt, mod.api, els);
  }
  return { finished, seconds:+vt.toFixed(2), taps, clips, els,
           history: els.rhythmBanner.history,
           banner: els.rhythmBanner.history[0] || '',
           sections: mod.api.sections ? mod.api.sections() : null,
           state: mod.api.state(), log };
}

// A student who hammers both targets throughout. Should never pass a measure.
export function masher(everyNFrames=7) {
  let n = 0;
  return () => (n++ % everyNFrames === 0) ? [n % 2 ? 'B' : 'C'] : [];
}

// A student who plays the CURRENT pattern back perfectly, on the beat. Reads
// the live measure out of the test seam rather than being told the answer, so
// it follows the section wherever its progression goes.
export function copycat(offsetSec = 0) {
  const done = new Set();
  return (now, api) => {
    const s = api.live && api.live();
    if (!s) return [];
    const out = [];
    s.slots.forEach((tok, i) => {
      if (tok !== 'B' && tok !== 'C') return;
      const key = s.start.toFixed(5) + ':' + i;
      if (done.has(key)) return;
      if (now >= s.start + i * s.slotDur + offsetSec) { done.add(key); out.push(tok); }
    });
    return out;
  };
}


// The judge on its own, for tests that want it without the section around it.
// Extracted from the same file at run time, so there is no second copy to
// drift out of step with the one that ships.
export function loadJudge() {
  const src = readFileSync(SRC_FILE, 'utf8');
  const a = src.indexOf('  function rhythmJudge(');
  if (a < 0) throw new Error('rhythmJudge not found in index.html');
  const end = src.indexOf('\n  }', a);
  if (end < 0) throw new Error('rhythmJudge has no end');
  return new Function(src.slice(a, end + 4) + '\nreturn rhythmJudge;')();
}
