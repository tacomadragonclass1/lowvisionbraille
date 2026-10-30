// Every write-playground test. Run: node tools/write-tests/run.mjs
//
// No build step and no test framework, the same rule the rhythm tests follow:
// the app has neither, and a dependency that must be installed is a dependency
// that will not be installed. Node alone runs this.
//
// Unlike the rhythm tests, which slice their module out of index.html, this
// loads the WHOLE file under a DOM stub and drives the real handlers. That is
// what lets it catch load-order faults - a const used before its declaration
// will throw here exactly as it would in a browser.
const suites = ['test_write.mjs', 'test_sightwords.mjs'];
let pass = 0, fail = 0;
for (const s of suites) {
  console.log(`\n${'='.repeat(60)}\n${s}\n${'='.repeat(60)}`);
  const r = (await import('./' + s)).default;
  pass += r.pass; fail += r.fail;
}
console.log(`\n${'='.repeat(60)}`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
