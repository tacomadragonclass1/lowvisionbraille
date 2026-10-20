// Every rhythm brain break test. Run: node tools/rhythm-tests/run.mjs
//
// There is no build step and no test framework on purpose - the app does not
// have either, and a dependency that has to be installed is a dependency that
// will not be installed. Node alone runs this.
const suites = ['test_break.mjs','test_speech.mjs','test_rotation.mjs'];
let pass=0, fail=0;
for (const s of suites) {
  console.log(`\n${'='.repeat(60)}\n${s}\n${'='.repeat(60)}`);
  const r = (await import('./'+s)).default;
  pass += r.pass; fail += r.fail;
}
console.log(`\n${'='.repeat(60)}`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
