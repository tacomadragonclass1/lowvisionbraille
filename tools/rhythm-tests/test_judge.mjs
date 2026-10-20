// The judge, on its own. Only WHICH SHAPE lands in WHICH SLOT is judged -
// there is deliberately no early/late reading anywhere in here.
import { loadJudge } from './harness.mjs';
const judge = loadJudge();
let pass=0, fail=0;
const ok=(l,c,x='')=>{ if(c){pass++;console.log('  ok   '+l+(x?'  '+x:''));}
                       else{fail++;console.log('  FAIL '+l+(x?'  '+x:''));} };

const BEAT=60/84, MEASURE=BEAT*4;          // 84 bpm, 4/4
const at=(slots,i)=>i*(MEASURE/slots.length);
const play=(slots,offsets={})=>slots.map((tok,i)=>
  (tok==='B'||tok==='C') ? { t:at(slots,i)+(offsets[i]||0), target:tok } : null
).filter(Boolean);

console.log('\n— playing it back exactly —');
{
  const s=['B','C','B','C'];
  ok('passes', judge(s,play(s),0,MEASURE).pass);
}

console.log('\n— tolerance is half a slot either side, and no more —');
{
  const s=['B','C','B','C'];
  const slot=MEASURE/4;                       // 714 ms at 84 bpm
  for (const frac of [0, .2, .45, -.45]) {
    const off=Object.fromEntries(s.map((_,i)=>[i,slot*frac]));
    ok(`${(frac*100).toFixed(0)}% of a slot off still passes`,
       judge(s,play(s,off),0,MEASURE).pass, `${(slot*frac*1000).toFixed(0)} ms`);
  }
  const off=Object.fromEntries(s.map((_,i)=>[i,slot*.75]));
  const r=judge(s,play(s,off),0,MEASURE);
  ok('75% of a slot off does NOT pass', !r.pass, JSON.stringify({wrong:r.wrong,stray:r.stray}));
}

console.log('\n— the shapes have to be the right ones, in the right order —');
{
  const s=['B','C','B','C'];
  const swapped=play(s).map(t=>({...t,target:t.target==='B'?'C':'B'}));
  ok('all shapes swapped fails', !judge(s,swapped,0,MEASURE).pass);
  const one=play(s); one[2].target='C';
  ok('one wrong shape fails', !judge(s,one,0,MEASURE).pass);
  ok('...and reports exactly one wrong', judge(s,one,0,MEASURE).wrong===1);
  const reordered=[{t:at(s,0),target:'C'},{t:at(s,1),target:'B'},
                   {t:at(s,2),target:'C'},{t:at(s,3),target:'B'}];
  ok('right count, wrong order fails', !judge(s,reordered,0,MEASURE).pass);
}

console.log('\n— rests must stay empty —');
{
  const s=['B','-','C','-'];
  ok('respecting the rests passes', judge(s,play(s),0,MEASURE).pass);
  const extra=[...play(s),{t:at(s,1),target:'B'}];
  const r=judge(s,extra,0,MEASURE);
  ok('filling a rest fails', !r.pass);
  ok('...counted as a wrong slot, not a stray', r.wrong===1 && r.stray===0,
     `wrong ${r.wrong} stray ${r.stray}`);
}

console.log('\n— too many, too few, and nothing at all —');
{
  const s=['B','C','B','C'];
  ok('missing one fails', !judge(s,play(s).slice(0,3),0,MEASURE).pass);
  ok('nothing at all fails', !judge(s,[],0,MEASURE).pass);
  const dbl=[...play(s),{t:at(s,1)+0.02,target:'C'}];
  const r=judge(s,dbl,0,MEASURE);
  ok('a double tap in one slot fails', !r.pass);
  ok('...counted as a stray', r.stray===1, `stray ${r.stray}`);
  const after=[...play(s),{t:MEASURE+0.6,target:'B'}];
  ok('a tap past the end of the bar fails', !judge(s,after,0,MEASURE).pass);
}

console.log('\n— mashing cannot pass anything —');
{
  for (const s of [['B','C','B','C'],['B','-','C','-'],
                   ['B','-','-','B','C','-','-','-']]) {
    const taps=[];
    for (let k=0;k<40;k++) taps.push({t:k*MEASURE/40, target:k%2?'C':'B'});
    ok(`mash vs [${s.join(' ')}]`, !judge(s,taps,0,MEASURE).pass);
  }
}

console.log('\n— eighth-note patterns judge on the tighter grid —');
{
  const s=['B','-','-','B','C','-','-','-'];
  ok('exact passes', judge(s,play(s),0,MEASURE).pass);
  const slot=MEASURE/8;                       // 357 ms
  const off=Object.fromEntries(s.map((_,i)=>[i,slot*.4]));
  ok('40% of an eighth off still passes', judge(s,play(s,off),0,MEASURE).pass,
     `${(slot*.4*1000).toFixed(0)} ms`);
  const far=Object.fromEntries(s.map((_,i)=>[i,slot*.9]));
  ok('a whole eighth off does not', !judge(s,play(s,far),0,MEASURE).pass);
}

export default { pass, fail };
