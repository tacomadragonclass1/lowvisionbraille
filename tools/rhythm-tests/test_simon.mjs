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

export default { pass, fail };
