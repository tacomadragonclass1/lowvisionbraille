// What a break actually does, end to end.
import { loadModule, run, masher, CLIP_DURATIONS } from './harness.mjs';
const SRC = loadModule();
let pass=0, fail=0;
const ok=(l,c,x='')=>{ if(c){pass++;console.log('  ok   '+l+(x?'  '+x:''));}
                       else{fail++;console.log('  FAIL '+l+(x?'  '+x:''));} };
const names = r => r.clips.map(c=>c.src.split('/').pop().replace('.wav',''));

// Pretend the student has had a break already, so we get the randomised path
// rather than the scripted opening. It ASSERTS the patch landed: a source
// edit that silently stops matching would turn every test below into a test of
// the first break, passing for the wrong reason.
function asLaterBreak(src) {
  const out = src.replace('let rTimesStarted=0;', 'let rTimesStarted=1;');
  if (out === src) throw new Error('asLaterBreak: rTimesStarted declaration moved - fix this patch');
  return out;
}
let quietFails=0;
const ok_quiet=(c,l)=>{ if(!c){ quietFails++; console.log('    · '+l); } };

console.log('\n— the first break a student ever gets is the scripted one —');
{
  const r = run({ moduleSrc:SRC });
  ok('ends by itself', r.finished, `after ${r.seconds}s`);
  ok('exact spoken script', names(r).join(' → ')==='intro → where → yourturn → len2 → yourturn → bye',
     names(r).join(' → '));
  ok('one break counted', r.state.runs===1);
  ok('banner names the beat and the turn lengths',
     /BOOM CLAP BOOM CLAP/.test(r.banner) && /1 and 2/.test(r.banner), r.banner);
}

console.log('\n— what the student plays changes NOTHING —');
{
  const quiet = run({ moduleSrc:SRC });
  const loud  = run({ moduleSrc:SRC, player:masher() });
  ok('a student who mashes gets the same spoken script',
     names(quiet).join()===names(loud).join());
  ok('...the same length of break', Math.abs(quiet.seconds-loud.seconds)<0.05,
     `${quiet.seconds}s vs ${loud.seconds}s`);
  ok('...and the same number of measures',
     quiet.state.measuresPlanned===loud.state.measuresPlanned);
  ok('the masher really did tap', loud.taps.length>20, `${loud.taps.length} taps`);
  ok('no verdict, no score, no coaching ever spoken',
     !names(loud).some(n=>/nice|again|early|late|listen|together|boomclap|holdclap|rest|offbeat|newbeat/.test(n)),
     names(loud).join(' '));
}

console.log('\n— a later break announces its length and randomises it —');
{
  const later = asLaterBreak(SRC);
  const seen = new Set();
  for (let i=0;i<40;i++) {
    const r = run({ moduleSrc:later });
    const n = names(r);
    ok_quiet(n[0]==='intro', 'starts with intro');
    ok_quiet(n[n.length-1]==='bye', 'ends with bye');
    const lens = n.filter(x=>/^len\d$/.test(x));
    ok_quiet(lens.length===2, 'two length announcements');
    lens.forEach(l=>seen.add(l));
    ok_quiet(lens[0]!==lens[1], 'never the same length twice running');
  }
  ok('40 later breaks all well-formed', quietFails===0, `${quietFails} problems`);
  ok('every length 1-4 gets used', [...seen].sort().join()==='len1,len2,len3,len4',
     [...seen].sort().join());
  // The honest version: four consecutive breaks on ONE module instance, which
  // is the only way to see what carries over between them.
  const session = run({ moduleSrc:SRC, breaks:4, maxSeconds:900 });
  const sn = names(session);
  ok('"where" is said once per session, not once per break',
     sn.filter(x=>x==='where').length===1, `${sn.filter(x=>x==='where').length} times in 4 breaks`);
  ok('every break still opens with the intro',
     session.marks.every(m=>sn[m]==='intro'));
  ok('only the FIRST break skips the length announcement',
     session.marks.slice(1).every(m=>/^len\d$/.test(sn[m+1])),
     session.marks.map(m=>sn.slice(m,m+3).join(' ')).join(' | '));
}

console.log('\n— the band demonstrates, then the student has the floor —');
{
  const r = run({ moduleSrc:SRC });
  // "Your turn!" must come after a demo and before the count-in, twice.
  const n = names(r);
  ok('two turns offered', n.filter(x=>x==='yourturn').length===2);
  ok('len2 is announced before the second turn',
     n.indexOf('len2') < n.lastIndexOf('yourturn'));
  ok('nothing is spoken between "Your turn" and the next announcement',
     n[2]==='yourturn' && n[3]==='len2');
}

console.log('\n— break length stays inside a sensible range —');
{
  const later = asLaterBreak(SRC);
  let min=1e9, max=0;
  for (let i=0;i<40;i++) { const r=run({moduleSrc:later});
    min=Math.min(min,r.seconds); max=Math.max(max,r.seconds); }
  const first = run({moduleSrc:SRC}).seconds;
  ok(`first break ${first}s, later breaks ${min}-${max}s`, max<80 && min>25,
     'a break must end while it is still welcome');
}

console.log('\n— the ACTIVITY runs set after set and never ends on its own —');
{
  const r = run({ moduleSrc:SRC, activity:true, runFor:420, maxSeconds:500 });
  ok('still running after 7 minutes', !r.finished && r.state.on,
     `${r.state.measuresPlanned} measures planned`);
  ok('never says goodbye', !names(r).includes('bye'), names(r).join(' '));
  ok('kept announcing turns', names(r).filter(x=>/^len\d$/.test(x)).length>8,
     `${names(r).filter(x=>/^len\d$/.test(x)).length} announcements`);
  ok('opened once, not once per set', names(r).filter(x=>x==='intro').length===1);
  ok('"where" still said exactly once', names(r).filter(x=>x==='where').length===1);
  // A long session must not accumulate script forever - rhythmSectionAt walks
  // the section list on every eighth note.
  ok('section list stays bounded', r.state.sections<=40, `${r.state.sections} sections held`);
  ok('the beat kept turning over', r.state.measuresPlanned>100,
     `${r.state.measuresPlanned} measures over ${r.seconds}s`);
  // The no-repeat rule has to survive the seam between one set and the next,
  // not just hold inside a set.
  const lens = names(r).filter(x=>/^len\d$/.test(x));
  const twice = lens.filter((l,i)=>i>0 && l===lens[i-1]);
  ok('no turn length announced twice running, across set seams too',
     twice.length===0, twice.length? 'repeated: '+twice.join(' ') : lens.join(' '));
}

console.log('\n— the BREAK shape still works, for when it goes back in —');
{
  const r = run({ moduleSrc:SRC });
  ok('one set, then it hands back', r.finished, `after ${r.seconds}s`);
  ok('says goodbye', names(r).includes('bye'));
  ok('mode reported as break', r.state.mode==='break', r.state.mode);
}

export default { pass, fail };
