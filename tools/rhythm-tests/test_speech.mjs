// Every spoken line must fit the room the script gives it. Starting the next
// clip stops the one before, so a line longer than its gap is cut off
// mid-sentence - which is silent, invisible in the code, and only audible.
import { loadModule, run, CLIP_DURATIONS } from './harness.mjs';
const SRC = loadModule();
let pass=0, fail=0;
const ok=(l,c,x='')=>{ if(c){pass++;console.log('  ok   '+l+(x?'  '+x:''));}
                       else{fail++;console.log('  FAIL '+l+(x?'  '+x:''));} };

console.log('\n— no spoken line is cut off by the next one —');
{
  // 30 breaks, so every random length and every pairing gets exercised.
  const r = run({ moduleSrc:SRC, breaks:30, maxSeconds:4000 });
  let worst=null;
  for (let i=0;i<r.clips.length-1;i++) {
    const f=r.clips[i].src.split('/').pop();
    const slack=(r.clips[i+1].t-r.clips[i].t)-CLIP_DURATIONS[f];
    if (!worst||slack<worst.slack) worst={f,slack:+slack.toFixed(2),
      need:+CLIP_DURATIONS[f].toFixed(2), got:+(r.clips[i+1].t-r.clips[i].t).toFixed(2)};
  }
  ok('across 30 breaks, every line finishes before the next starts', worst.slack>0,
     `tightest = ${worst.f} needs ${worst.need}s, got ${worst.got}s (+${worst.slack}s)`);
  ok('every break completed', r.finished, `${r.clips.length} lines over ${r.seconds}s`);
}

console.log('\n— the shipped clips are exactly the ones the game asks for —');
{
  const src = (await import('node:fs')).readFileSync(
    (await import('node:url')).fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
  const asked = [...src.matchAll(/audio\/rhythm\/(\w+)\.wav/g)].map(m=>m[1]);
  const have  = Object.keys(CLIP_DURATIONS).map(f=>f.replace('.wav',''));
  const unique = [...new Set(asked)].sort();
  ok('no line the game asks for is missing',
     unique.every(a=>have.includes(a)), unique.filter(a=>!have.includes(a)).join()||'none missing');
  ok('no clip ships that nothing asks for',
     have.every(h=>unique.includes(h)), have.filter(h=>!unique.includes(h)).join()||'none orphaned');
  ok('eight lines, all of them announcements', unique.length===8, unique.join(' '));
}

export default { pass, fail };
