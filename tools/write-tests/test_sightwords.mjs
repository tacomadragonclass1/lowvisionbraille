// The high frequency word bank: its UEB spellings, and the contract between
// the word list and the stylesheet.
//
// The bank went 13 -> 35 words on 2026-10-30, and the longest of them is
// seven cells in the letter-by-letter convention where nothing before it went
// past four. That is a silent failure mode: the cells-N rules are CSS, the
// word list is JavaScript, and nothing connected the two. A word needing a
// count the stylesheet had never heard of would have rendered with no dot
// sizing at all. The last test here is that connection, so adding a long word
// without extending the stylesheet fails the suite instead of the tablet.
import { loadApp } from './dom.mjs';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(HERE, '..', '..', 'index.html');
const REPO = path.join(HERE, '..', '..');

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log('  ok   ' + msg))
                                 : (fail++, console.log('  FAIL ' + msg)); };

loadApp(HTML, `
  globalThis.__S = { SIGHT_WORDS, SIGHT_UEB, BRAILLE, CAPITAL_SIGN,
                     cellsFor: (w, conv) => { sightConvention = conv; return sightCells(w); },
                     build: (specs) => { buildCells(specs); return brailleEl.className; },
                     deck: () => { mode = 'sight'; buildOrder(); return order; },
                     // Deal one specific card through the REAL setupItem, so the
                     // {word, round} item shape is exercised end to end.
                     deal: (w, round) => {
                       mode = 'sight'; sightConvention = 'grapheme';
                       order = [{ word: w, round }]; orderIndex = 0;
                       setupItem();
                       return { cls: brailleEl.className,
                                cells: cells.length,
                                round2: document.body.classList.contains('round2'),
                                print: sightGroups.length,
                                word: word, sightRound: sightRound };
                     } };
`);
const S = globalThis.__S;

console.log('\n  -- the bank --');
ok(S.SIGHT_WORDS.length === 35, `thirty-five words (got ${S.SIGHT_WORDS.length})`);
ok(new Set(S.SIGHT_WORDS).size === S.SIGHT_WORDS.length, 'no duplicates');
const noUeb = S.SIGHT_WORDS.filter(w => !S.SIGHT_UEB[w]);
ok(noUeb.length === 0, 'every word has a UEB spelling' + (noUeb.length ? ` (missing: ${noUeb})` : ''));
const extraUeb = Object.keys(S.SIGHT_UEB).filter(w => !S.SIGHT_WORDS.includes(w));
ok(extraUeb.length === 0, 'and no UEB spelling is orphaned' + (extraUeb.length ? ` (${extraUeb})` : ''));

console.log('\n  -- every clip the bank needs is on disk --');
const missingWav = S.SIGHT_WORDS.filter(w =>
  !fs.existsSync(path.join(REPO, 'audio', 'sight', w.toLowerCase() + '.wav')));
ok(missingWav.length === 0,
   'audio/sight/<word>.wav exists for all 35' + (missingWav.length ? ` (missing: ${missingWav})` : ''));

console.log('\n  -- UEB cells are well formed --');
let badDots = [], badName = [];
for (const w of S.SIGHT_WORDS) {
  for (const spec of S.SIGHT_UEB[w]) {
    const dots = spec.name ? S.BRAILLE[spec.name] : spec.dots;
    if (!Array.isArray(dots) || !dots.length ||
        dots.some(d => !Number.isInteger(d) || d < 1 || d > 6) ||
        new Set(dots).size !== dots.length) badDots.push(w + ':' + JSON.stringify(spec));
    if (spec.name && !S.BRAILLE[spec.name]) badName.push(w + ':' + spec.name);
  }
}
ok(badDots.length === 0, 'every cell is a set of distinct dots 1-6' + (badDots.length ? ` (${badDots})` : ''));
ok(badName.length === 0, 'every named cell names a real letter' + (badName.length ? ` (${badName})` : ''));

// The project's own rule: a cell is spoken only when it IS that letter in the
// spelling, so the named cells of a word must read as its letters IN ORDER.
// Naming a wordsign - "ex" over the one cell that means `it` - is the mistake
// this guards. A subsequence check is the exact shape of that rule.
let notSubseq = [];
for (const w of S.SIGHT_WORDS) {
  const named = S.SIGHT_UEB[w].filter(s => s.name).map(s => s.name);
  const letters = [...w.toLowerCase()];
  let i = 0;
  for (const n of named) { const at = letters.indexOf(n, i); if (at < 0) { notSubseq.push(w); break; } i = at + 1; }
}
ok(notSubseq.length === 0,
   'named cells are the word\'s own letters, in order' + (notSubseq.length ? ` (${notSubseq})` : ''));

console.log('\n  -- letter-by-letter is one cell per print letter --');
let wrongCount = [];
for (const w of S.SIGHT_WORDS) {
  const want = [...w].reduce((n, ch) => n + (ch !== ch.toLowerCase() ? 2 : 1), 0);
  if (S.cellsFor(w, 'grapheme').length !== want) wrongCount.push(w);
}
ok(wrongCount.length === 0,
   'a capital costs two cells, every other letter one' + (wrongCount.length ? ` (${wrongCount})` : ''));
ok(S.cellsFor('because', 'grapheme').length === 7, '`because` is seven cells');
ok(S.cellsFor('I', 'grapheme')[0].required.join() === S.CAPITAL_SIGN.join(),
   'and `I` still leads with the capital indicator');

console.log('\n  -- the word list and the stylesheet agree --');
const css = fs.readFileSync(HTML, 'utf8');
const counts = new Set();
for (const w of S.SIGHT_WORDS) {
  counts.add(S.cellsFor(w, 'grapheme').length);
  counts.add(S.cellsFor(w, 'ueb').length);
}
const sorted = [...counts].sort((a, b) => a - b);
ok(S.build(S.cellsFor('because', 'grapheme')) === 'cells-7',
   'buildCells labels the row by its cell count');
let noRule = [];
for (const n of sorted) {
  const r1 = new RegExp(`body\\.mode-sight #braille\\.cells-${n}\\s*\\{[^}]*--d:`).test(css);
  const r2 = new RegExp(`body\\.mode-sight\\.round2 #braille\\.cells-${n}\\s*\\{[^}]*--d:`).test(css);
  const dot = n === 1 || new RegExp(`#braille\\.cells-${n} \\.dot\\s*\\{`).test(css);
  if (!r1 || !r2 || !dot) noRule.push(`cells-${n}${!r1 ? ' r1' : ''}${!r2 ? ' r2' : ''}${!dot ? ' dot' : ''}`);
}
ok(noRule.length === 0,
   `every cell count the bank can produce (${sorted.join(', ')}) is sized in both rounds` +
   (noRule.length ? ` -- MISSING: ${noRule.join('; ')}` : ''));

console.log('\n  -- the interleaved deck --');
// Both rounds of every word live in one shuffled deck. The rule is that a
// round-2 card can only come up once its round-1 counterpart has played, and
// the deck gets that from HOW it is built rather than by checking. These run
// over many decks because the property has to hold for every shuffle, not for
// a lucky one.
let sizeBad = 0, precedenceBad = 0, pairBad = 0, firstNotRound1 = 0, shapeBad = 0;
let adjacent = 0, decks = 300;
for (let d = 0; d < decks; d++) {
  const deck = S.deck();
  if (deck.length !== S.SIGHT_WORDS.length * 2) sizeBad++;
  if (deck.some(c => typeof c !== 'object' || !c.word || (c.round !== 1 && c.round !== 2))) shapeBad++;
  if (deck[0].round !== 1) firstNotRound1++;
  const seenAt = new Map(), count = new Map();
  deck.forEach((c, i) => {
    count.set(c.word + '|' + c.round, (count.get(c.word + '|' + c.round) || 0) + 1);
    if (c.round === 1) seenAt.set(c.word, i);
    else if (!seenAt.has(c.word)) precedenceBad++;          // round 2 with no round 1 before it
    else if (i - seenAt.get(c.word) === 1) adjacent++;      // round 2 immediately after its round 1
  });
  // exactly one round-1 and one round-2 card per word
  for (const w of S.SIGHT_WORDS)
    if (count.get(w + '|1') !== 1 || count.get(w + '|2') !== 1) pairBad++;
}
ok(sizeBad === 0, `a deck is both rounds of every word (${S.SIGHT_WORDS.length * 2} cards)`);
ok(shapeBad === 0, 'every card is a {word, round} pair');
ok(pairBad === 0, 'exactly one round-1 and one round-2 card per word');
ok(precedenceBad === 0,
   `a round-2 card never precedes its own round-1 card (${decks} decks)`);
ok(firstNotRound1 === 0,
   `the first card of a deck is always round 1, so round 2 never autoplays without a gesture (${decks} decks)`);
// Not a failure condition - just held to a sane rate so a regression that
// started pairing cards up would be visible. ~1 per deck is expected.
const perDeck = adjacent / decks;
ok(perDeck < 4,
   `a word's two cards land back-to-back rarely (${perDeck.toFixed(2)} per deck of ${S.SIGHT_WORDS.length * 2})`);

console.log('\n  -- a card is dealt through the real setupItem --');
// The item shape changed from a bare string to a {word, round} pair, so the
// one thing worth proving is that BOTH rounds still come out right when the
// real setupItem unpacks one. A round-1 card lays out the print word; a
// round-2 card must lay out none at all.
const one = S.deal('because', 1);
ok(one.word === 'because' && one.sightRound === 1, 'a round-1 card unpacks to its word and round');
ok(one.cls === 'cells-7' && one.cells === 7, 'and builds seven cells for `because`');
ok(one.print === 7, 'round 1 lays out the print word (one <g> per letter)');
ok(one.round2 === false, 'and the round-2 body class is off');

const two = S.deal('because', 2);
ok(two.word === 'because' && two.sightRound === 2, 'a round-2 card unpacks to its word and round');
ok(two.cls === 'cells-7' && two.cells === 7, 'and still builds seven cells');
ok(two.print === 0, 'round 2 lays out NO print - that is what makes it a reading test');
ok(two.round2 === true, 'and the round-2 body class is on');

const ueb = (() => { const r = S.deal('black', 2); return r; })();
ok(ueb.cells === 5, 'a five-cell word deals too (`black`, letter by letter)');

export default { pass, fail };
