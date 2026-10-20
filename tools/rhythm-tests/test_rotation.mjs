import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const s = readFileSync(join(REPO,'index.html'),'utf8');
const a = s.indexOf('  // ------------------------------------------------------ which break runs ---');
const b = s.indexOf('\n  }', s.indexOf('function pickBreak')) + 4;
const src = s.slice(a,b);
if (!/function pickBreak/.test(src)) throw new Error('pickBreak not found');

let pass=0, fail=0;
const ok=(l,c,x='')=>{ if(c){pass++;console.log('  ok   '+l+(x?'  '+x:''));}
                       else{fail++;console.log('  FAIL '+l+(x?'  '+x:''));} };

function harness(pin) {
  const seen=[];
  const body = `${src}
    if (${JSON.stringify(pin)}) breakRotation=[${JSON.stringify(pin)}];
    return { pickBreak, fire(n){ for(let i=0;i<n;i++) pickBreak(()=>{}); } };`;
  const f = new Function('startBrainBreak','startRhythmBreak',body);
  return { api: f(cb=>{seen.push('carl');cb();}, cb=>{seen.push('rhythm');cb();}), seen };
}

console.log('\n— taskDone owns WHEN; pickBreak owns only WHICH —');
{
  const h=harness(null); h.api.fire(6);
  // Rhythm was PROMOTED out of the break rotation to its own menu section, so
  // breaks are Carl and only Carl. The break form of rhythm still exists and
  // is still tested below - it is simply not scheduled. Putting 'rhythm' back
  // in breakRotation is the one-line change that re-enables it.
  ok('breaks are Carl only - rhythm is not scheduled',
     h.seen.every(x=>x==='carl'), h.seen.join(','));
  ok('six breaks, six dances', h.seen.length===6);
}
{
  const h=harness('carl'); h.api.fire(4);
  ok('?break=carl pins Carl', h.seen.every(x=>x==='carl'), h.seen.join(','));
}
{
  const h=harness('rhythm'); h.api.fire(4);
  ok('?break=rhythm pins the beat game', h.seen.every(x=>x==='rhythm'), h.seen.join(','));
}
{
  const h=harness(null);
  let ran=0; h.api.pickBreak(()=>ran++);
  ok('the continuation is always called', ran===1);
}
export default { pass, fail };
