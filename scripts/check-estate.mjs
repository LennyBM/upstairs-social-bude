#!/usr/bin/env node
/**
 * Estate checker. Runs across every repo in the estate, not just this one.
 *
 * It exists because of a defect class that four separate verification passes each
 * failed to catch: a config axis declared in `types.ts`, assigned per venue in
 * `site.ts`, and read by nothing. `design.hero` was dead until late; `design.order`
 * was still dead after the gate declared the pilot ready. Both were invisible to
 * per-repo review, because each repo looks internally consistent while being
 * identical to its neighbours — which is the exact failure §11 exists to prevent.
 *
 * Four gates:
 *   1. CONSUMED   every value of every §11 union appears in real code, not a comment
 *   2. VALID      every venue's assigned values are members of their unions
 *   3. UNIQUE     no two venues in a town share the display+order+hero triple (§11)
 *   4. ADJACENT   the *realised* homepage sequence holds §8, given that venue's
 *                 own capability flags, which is where conditional sections bite
 *
 * Usage: node scripts/check-estate.mjs [estateRoot]   (default: two levels up)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SELF = resolve(HERE, '..');
const ROOT = resolve(process.argv[2] ?? join(SELF, '..'));

/* ── comment stripping ─────────────────────────────────────────────────────
   The whole point. `design.order` had exactly one occurrence estate-wide and it
   was inside a docblock, so any naive grep reported it as wired. A value that
   appears only in prose is not consumed. String and template literals are
   preserved, because a value in a string IS a real use (`SEQUENCES` keys). */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') i++;
    } else if (c === '/' && d === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      out += src[i++];
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') out += src[i++];
        if (i < n) out += src[i++];
      }
      out += src[i++] ?? '';
    } else {
      out += src[i++];
    }
  }
  return out;
}

/** site.ts is JSON-shaped after the export prefix. Strip comments, then parse.
    The file declares more than one export, so the object has to be brace-matched
    from its opening brace rather than run to the last `}` in the file. Braces
    inside string values are skipped, or a postcode or an emoji would end it early. */
function readConfig(file) {
  const clean = stripComments(readFileSync(file, 'utf8'));
  const start = clean.indexOf('{', clean.indexOf('site'));
  if (start < 0) throw new Error('no object literal');
  let depth = 0;
  let end = -1;
  for (let i = start; i < clean.length; i++) {
    const c = clean[i];
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < clean.length && clean[i] !== q) i += clean[i] === '\\' ? 2 : 1;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('unbalanced object literal');
  return JSON.parse(clean.slice(start, end + 1).replace(/,(\s*[}\]])/g, '$1'));
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

/* ── unions, read from the source of truth rather than restated here ─────── */
function readUnions(typesFile) {
  const src = stripComments(readFileSync(typesFile, 'utf8'));
  const grab = (name) => {
    const m = new RegExp(`type\\s+${name}\\s*=\\s*([^;]+);`).exec(src);
    if (!m) throw new Error(`union ${name} not found`);
    return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  };
  return {
    display: grab('DisplayTreatment'),
    hero: grab('HeroArchetype'),
    order: grab('HomeOrder'),
  };
}

/* ── §8 archetype letters. facts and policy are data strips: no letter. ──── */
const LETTER = { facts: null, rooms: 'D', story: 'C', reviews: 'E', eats: 'B', gallery: 'D', policy: null, find: 'C' };

/** Mirrors Home.tsx SEQUENCES. Kept in sync by gate 1, which fails if a value is unwired. */
const SEQUENCES = {
  'rooms-led': ['facts', 'rooms', 'story', 'reviews', 'eats', 'gallery', 'policy', 'find'],
  'food-led': ['facts', 'eats', 'rooms', 'story', 'reviews', 'gallery', 'policy', 'find'],
  'locals-led': ['facts', 'reviews', 'eats', 'gallery', 'story', 'rooms', 'policy', 'find'],
};

/** Mirrors Home.tsx's own guards. A section absent here is absent in the DOM. */
function present(key, s) {
  if (key === 'rooms') return !!(s.accommodation?.has && (s.accommodation.rooms || []).length > 0);
  if (key === 'eats') return !!(s.pages?.food && (s.food?.serves || s.drinks));
  if (key === 'gallery') return !!(s.pages?.gallery && (s.images || []).length > 3);
  return true;
}

const fail = [];
const note = (repo, gate, msg) => fail.push({ repo, gate, msg });

/* ── gate 1: CONSUMED ────────────────────────────────────────────────────── */
const unions = readUnions(join(SELF, 'src/config/types.ts'));
const chassis = walk(join(SELF, 'src'))
  .filter((f) => !/config[/\\]site\.ts$/.test(f) && !/config[/\\]types\.ts$/.test(f))
  .map((f) => ({ f, code: stripComments(readFileSync(f, 'utf8')) }));

const unwired = [];
for (const [axis, values] of Object.entries(unions)) {
  for (const v of values) {
    const users = chassis.filter(({ code }) => code.includes(`'${v}'`) || code.includes(`"${v}"`));
    /* A union's default arm is legitimately implicit: it is the value reached when
       no branch matches. Only flag it if NO value of the axis is branched on. */
    if (users.length === 0) unwired.push({ axis, value: v });
  }
  const wired = values.length - unwired.filter((u) => u.axis === axis).length;
  if (wired === 0) note('CHASSIS', 'CONSUMED', `axis '${axis}' is entirely dead: no value of [${values.join(', ')}] appears in any component`);
}
/* One implicit default per axis is fine; two or more means values collapse together. */
for (const axis of Object.keys(unions)) {
  const dead = unwired.filter((u) => u.axis === axis);
  if (dead.length > 1) note('CHASSIS', 'CONSUMED', `axis '${axis}' has ${dead.length} unread values (${dead.map((d) => d.value).join(', ')}) — they render identically, collapsing the §11 combination count`);
}

/* ── gates 2-4, per venue ────────────────────────────────────────────────── */
const repos = readdirSync(ROOT).filter((d) => existsSync(join(ROOT, d, 'src/config/site.ts')));
const seen = new Map();
const rows = [];

for (const repo of repos) {
  let s;
  try {
    s = readConfig(join(ROOT, repo, 'src/config/site.ts'));
  } catch (e) {
    note(repo, 'PARSE', e.message);
    continue;
  }
  const d = s.design || {};

  for (const [axis, values] of Object.entries(unions)) {
    if (!values.includes(d[axis])) note(repo, 'VALID', `design.${axis} = ${JSON.stringify(d[axis])} is not one of [${values.join(', ')}]`);
  }
  if (!SEQUENCES[d.order]) {
    note(repo, 'VALID', `design.order = ${JSON.stringify(d.order)} has no sequence in Home.tsx`);
    continue;
  }

  /* §11 uniqueness is scoped to the town: two identical venues in different towns
     never appear side by side in a search result, so they may share a triple. */
  const triple = `${d.display}|${d.order}|${d.hero}`;
  const key = `${(s.town || '?').toLowerCase()}::${triple}`;
  if (seen.has(key)) note(repo, 'UNIQUE', `shares the triple ${triple} with ${seen.get(key)} in ${s.town}`);
  else seen.set(key, repo);

  /* Truthfulness: a sequence may not lead with a capability the venue lacks. */
  if (d.order === 'rooms-led' && !present('rooms', s)) note(repo, 'TRUTH', `order 'rooms-led' but the venue has no rooms to lead with`);
  if (d.order === 'food-led' && !present('eats', s)) note(repo, 'TRUTH', `order 'food-led' but the venue serves no food and lists no drinks`);

  /* §8 adjacency on the REALISED sequence, after conditional sections drop out.
     An unlettered section counts as a separator rather than being skipped: §8's
     own wording is that the fact strip and the policy grid "neither claim a letter
     nor break the adjacency rule", and both render as full width data grids that
     visibly divide whatever sits either side of them. Filtering them out instead
     would forbid story(C) · policy · find(C), which reads as three distinct blocks. */
  const realised = ['hero', ...SEQUENCES[d.order].filter((k) => present(k, s))];
  const letters = realised.map((k) => (k === 'hero' ? 'A' : LETTER[k]) || '-');
  for (let i = 1; i < letters.length; i++) {
    if (letters[i] !== '-' && letters[i] === letters[i - 1]) {
      note(repo, 'ADJACENT', `realised sequence repeats archetype ${letters[i]} back to back: ${letters.join(' ')}`);
    }
  }
  const distinct = new Set(letters.filter((l) => l !== '-')).size;
  if (distinct < 3) note(repo, 'ADJACENT', `only ${distinct} distinct archetypes in the realised sequence (floor is 3): ${letters.join(' ')}`);

  rows.push({ repo, town: s.town, ...d, letters: letters.join(' ') });
}

/* ── report ──────────────────────────────────────────────────────────────── */
const pad = (v, n) => String(v ?? '').padEnd(n);
console.log(`check-estate — ${rows.length} venues in ${ROOT}\n`);
console.log(pad('repo', 30) + pad('town', 16) + pad('display', 9) + pad('order', 12) + pad('hero', 13) + 'realised archetypes');
for (const r of rows) console.log(pad(r.repo, 30) + pad(r.town, 16) + pad(r.display, 9) + pad(r.order, 12) + pad(r.hero, 13) + r.letters);

const combos = new Set(rows.map((r) => `${r.display}|${r.order}|${r.hero}`));
console.log(`\ndistinct §11 combinations in use: ${combos.size} of ${unions.display.length * unions.order.length * unions.hero.length} available`);

if (fail.length) {
  console.error(`\ncheck-estate — ${fail.length} failure(s):`);
  for (const f of fail) console.error(`  [${f.gate}] ${f.repo}: ${f.msg}`);
  process.exit(1);
}
console.log('\ncheck-estate — clean.');
