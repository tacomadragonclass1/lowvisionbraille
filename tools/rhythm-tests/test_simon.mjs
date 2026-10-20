// What the rhythm section actually does: call, response, and what happens to
// a student who gets it right or wrong.
import { loadModule, run, masher, copycat } from './harness.mjs';
const SRC = loadModule();
let pass=0, fail=0;
const ok=(l,c,x='')=>{ if(c){pass++;console.log('  ok   '+l+(x?'  '+x:''));}
                       else{fail++;console.log('  FAIL '+l+(x?'  '+x:''));} };

console.log('\n— nothing is ever spoken —');
{
  const quiet = run({ moduleSrc:SRC, activity:true, runFor:240, maxSeconds:300 });
  const loud  = run({ moduleSrc:SRC, activity:true, runFor:240, maxSeconds:300, player:masher() });
  ok('no audio clip is played at all, idle', quiet.clips.length===0,
     quiet.clips.map(c=>c.src).join(' '));
  ok('no audio clip is played at all, while tapping', loud.clips.length===0,
     loud.clips.map(c=>c.src).join(' '));
}

console.log('\n— the first task is boom clap boom clap —');
{
  const r = run({ moduleSrc:SRC, activity:true, runFor:20, maxSeconds:60 });
  ok('banner names it', /BOOM CLAP BOOM CLAP/.test(r.banner), r.banner);
  ok('it is pattern 1 of the list', /1 of /.test(r.banner), r.banner);
}

console.log('\n— a student who plays it back moves on; one who does not, does not —');
{
  const good = run({ moduleSrc:SRC, activity:true, runFor:300, maxSeconds:400,
                     player:copycat() });
  ok('copycat passes measures', good.state.passed>0, `${good.state.passed} passed`);
  ok('copycat advances through the list', good.state.task>0,
     `reached pattern ${good.state.task+1}`);
  ok('copycat never has to retry', good.state.attempt===0, `attempt ${good.state.attempt}`);

  const idle = run({ moduleSrc:SRC, activity:true, runFor:300, maxSeconds:400 });
  ok('doing nothing passes nothing', idle.state.passed===0);
  ok('doing nothing stays on pattern 1', idle.state.task===0);
  ok('doing nothing racks up retries', idle.state.attempt>3, `attempt ${idle.state.attempt}`);

  const mash = run({ moduleSrc:SRC, activity:true, runFor:300, maxSeconds:400,
                     player:masher(3) });
  ok('mashing passes nothing', mash.state.passed===0, `${mash.state.passed} passed`);
  ok('mashing stays on pattern 1', mash.state.task===0);
}

console.log('\n— the targets are locked while the band plays —');
{
  // Sample the lock across a long run and check it alternates, and that taps
  // during the lock are discarded rather than counted.
  const seen=new Set();
  let tapsWhileLocked=0;
  const r = run({ moduleSrc:SRC, activity:true, runFor:120, maxSeconds:200,
    player:(now,api)=>{ if (api.state().locked) { tapsWhileLocked++; return ['B']; } return []; },
    onEvent:(vt,api)=>seen.add(api.state().locked) });
  ok('the lock goes both ways over a run', seen.has(true)&&seen.has(false),
     [...seen].join(','));
  ok('taps were attempted while locked', tapsWhileLocked>0, `${tapsWhileLocked} attempts`);
  ok('...and none of them passed a measure', r.state.passed===0);
}

console.log('\n— every pattern is one measure, and well formed —');
{
  const r = run({ moduleSrc:SRC, activity:true, runFor:10, maxSeconds:40 });
  const pats = r.patterns || null;
  ok('fifteen patterns', SRC.match(/\{ slots:\[/g).length>=15,
     `${SRC.match(/\{ slots:\[/g).length} found`);
  ok('no pattern-shape warning at load',
     !r.log.some(l=>String(l.ev||'').includes('warn')));
}

console.log('\n— the groove never stops, and the script stays bounded —');
{
  const r = run({ moduleSrc:SRC, activity:true, runFor:600, maxSeconds:700,
                  player:copycat() });
  ok('still running after ten minutes', r.state.on && !r.finished);
  ok('section list stays bounded', r.state.sections<=18, `${r.state.sections} sections`);
  ok('kept planning measures', r.state.measuresPlanned>100,
     `${r.state.measuresPlanned} measures over ${r.seconds}s`);
  ok('wrapped the pattern list and kept going', r.state.passed>10,
     `${r.state.passed} measures passed`);
}

console.log('\n— the brain-break shape still ends itself —');
{
  const r = run({ moduleSrc:SRC, maxSeconds:300 });
  ok('it finishes', r.finished, `after ${r.seconds}s`);
  ok('mode reported as break', r.state.mode==='break', r.state.mode);
}

console.log('\n— a pattern is answered three times, each with its own demo —');
{
  const r = run({ moduleSrc:SRC, activity:true, runFor:200, maxSeconds:300,
                  player:copycat() });
  // Three correct measures per pattern, not one.
  const patterns = Math.floor(r.state.passed / 3);
  ok('three correct measures per pattern',
     r.state.task === patterns % 15, `${r.state.passed} correct, on pattern ${r.state.task+1}`);
  ok('the rep counter cycles 0,1,2 and never exceeds the target',
     r.state.reps < 3, `reps ${r.state.reps}`);

  // Every student bar must be preceded by a band bar: the band always
  // demonstrates first, so the student never plays three unassisted measures.
  const phases=[]; let last=null;
  run({ moduleSrc:SRC, activity:true, runFor:120, maxSeconds:200, player:copycat(),
        onEvent:(vt,api)=>{ const l=api.state().locked;
          if(l!==last){ last=l; phases.push(l?'band':'student'); } }});
  const studentAfterBand = phases.every((p,i)=> p!=='student' || phases[i-1]==='band' || i===0);
  ok('every student bar follows a demonstration', studentAfterBand,
     phases.slice(0,8).join(' → '));
  ok('no two student bars in a row',
     !phases.some((p,i)=>p==='student'&&phases[i+1]==='student'));
}

console.log('\n— the separator bar: drums keep going, the bass drops out —');
{
  const r = run({ moduleSrc:SRC, activity:true, runFor:150, maxSeconds:250,
                  player:copycat() });
  const BAR=(60/84)*4, T0=0.35, bassHz=new Set([110,130.81,98]);
  const bars={};
  for (const e of r.scheduled) {
    const bar=Math.floor((e.t-T0)/BAR+1e-6);
    if (bar<0) continue;
    bars[bar]=bars[bar]||{bass:0,other:0};
    if (bassHz.has(+e.hz.toFixed(2))) bars[bar].bass++; else bars[bar].other++;
  }
  const keys=Object.keys(bars).map(Number).sort((a,b)=>a-b);
  const noBass=keys.filter(k=>bars[k].bass===0);
  ok('some bars drop the bass entirely', noBass.length>0, `bars ${noBass.join(', ')}`);
  ok('they are exactly 10 bars apart - 3 cycles of 3 bars, plus the separator',
     noBass.every((k,i)=> i===0 || k-noBass[i-1]===10), noBass.join(', '));
  ok('the drums keep playing through them',
     noBass.every(k=>bars[k].other>=40), noBass.map(k=>bars[k].other).join(', '));
  ok('every other bar has its bass', keys.filter(k=>bars[k].bass>0).length===keys.length-noBass.length);
}

console.log('\n— a wrong measure costs a rep, not the tally —');
{
  // Plays correctly only every other measure: should still get there, just slower.
  let n=0;
  const half = (now, api) => (Math.floor(n++/60)%2===0) ? [] : copycatInner(now, api);
  const inner = copycat();
  function copycatInner(now, api){ return inner(now, api); }
  const sloppy = run({ moduleSrc:SRC, activity:true, runFor:200, maxSeconds:300,
                       player:half });
  const clean  = run({ moduleSrc:SRC, activity:true, runFor:200, maxSeconds:300,
                       player:copycat() });
  ok('a student who misses some still progresses', sloppy.state.passed>0,
     `${sloppy.state.passed} correct`);
  ok('...but slower than one who does not', sloppy.state.passed<clean.state.passed,
     `${sloppy.state.passed} vs ${clean.state.passed}`);
}

export default { pass, fail };
