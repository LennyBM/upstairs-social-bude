#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  optimise-images.mjs — the estate image pipeline (spec §12 LCP, §14 CLS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  WHY THIS EXISTS
 *  The supplied venue photography is unoptimised camera-grade JPEG: 6.8 MB
 *  across 23 files in the pilot, served as bare <img src> with no srcset, no
 *  sizes and no modern format. On rural 4G that is the whole LCP budget spent
 *  on one photograph. This runs once per repo and is the only thing that has
 *  to run: there is no build-time plugin and no runtime dependency.
 *
 *  THE CONTRACT THIS SCRIPT ESTABLISHES
 *  For every original `NAME.ext` it emits, into public/images/:
 *
 *    NAME.jpg          optimised JPEG at the top width. SAME NAME AS THE
 *                      ORIGINAL, so every existing reference — src/config/
 *                      site.ts, og:image, JSON-LD, a hand-written <img> in a
 *                      repo that never adopts <Img> — keeps resolving with no
 *                      code change at all. This is the universal fallback.
 *    NAME-<w>.webp     the responsive ladder, modern format.
 *    NAME-<w>.jpg      a sparse JPEG ladder, for the ~2% with no WebP.
 *
 *  and writes src/config/images.ts, the typed manifest <Img> reads to build
 *  srcset/sizes and to emit width/height (CLS).
 *
 *  ORIGINALS ARE NEVER DESTROYED. On first run the untouched originals are
 *  MOVED to assets-src/images/, which is outside publicDir so it is never
 *  shipped, and which becomes the permanent source of truth. Re-running
 *  therefore always re-encodes from the original, never from a previous
 *  encode — the script is idempotent and generation-loss free. Delete
 *  public/images/ entirely and `npm run images` rebuilds it.
 *
 *  NEVER UPSCALES. Ladder steps above an image's intrinsic width are dropped.
 *  The pilot's own hero is 810x1080; asking for 1600 would have invented
 *  detail and quadrupled the bytes for nothing.
 *
 *  THE HERO IS BUDGET-FITTED, NOT QUALITY-FITTED. §12 sets a hard 180 KB hero
 *  ceiling. A fixed quality cannot honour a byte budget across 38 repos whose
 *  heroes differ in size and noise, so the hero's top step is binary-searched
 *  down the quality scale until it fits, and the script FAILS if it cannot.
 *
 *  USAGE
 *    node scripts/optimise-images.mjs           transform + write manifest
 *    node scripts/optimise-images.mjs --check   verify only, exit 1 on drift
 *
 *  DEPENDENCY: sharp, devDependency only. Nothing ships to the browser.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ORIGINALS_DIR = path.join(ROOT, 'assets-src', 'images');
const OUT_DIR = path.join(ROOT, 'public', 'images');
const SITE_TS = path.join(ROOT, 'src', 'config', 'site.ts');
const MANIFEST_TS = path.join(ROOT, 'src', 'config', 'images.ts');

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');

/* ── ladder ──────────────────────────────────────────────────────────────
 * 480 / 960 / 1600 is the spec's own ladder (§10 item 6), not a judgement
 * call, and 1600 is therefore also the ceiling: nothing in this design system
 * renders an image wider than the 72rem container bled to a 1440 viewport.
 *
 * ONE ladder for every image, capped at the intrinsic width. Role based
 * ladders were rejected: a filename in `site.images` lands in a 350px rail
 * tile, a ~45vw split band and a 90vw lightbox on three different routes of
 * the same site, and the fallback in Home.tsx/Rooms.tsx
 * (`site.images[(i + 4) % site.images.length]`) means any gallery image can
 * become a room card on any repo. `sizes` at the call site resolves that
 * correctly at zero build cost; a per-role ladder would need static analysis
 * of every call site and would break the first time a page reshuffled.
 */
const LADDER = [480, 960, 1600];
/** Spec §10 item 6 tops out at 1600. Sources wider than this are downsized. */
const MAX_WIDTH = 1600;
/**
 * The JPEG ladder is ONE rung, and that is a measured decision rather than a
 * shortcut. Every browser without WebP is a pre-2020 iOS Safari, i.e. a phone
 * — a 390px viewport that resolves `sizes` to the 480 rung and never asks for
 * anything wider. A 960 rung cost 1.0 MB on disk across the pilot's 23 images
 * and would have been fetched by essentially nobody. Anything that somehow
 * does want more still gets the base file, which is itself now ~50% smaller
 * than the original it replaced, so no client is worse off than the baseline.
 */
const JPEG_LADDER = [480];

const WEBP_QUALITY = 74;
const JPEG_QUALITY = 76;

/**
 * Fallback top steps, tried in order when 1600 cannot be made to fit the
 * budget at an acceptable quality. See `resolveTopStep`.
 */
const TOP_CANDIDATES = [1600, 1280, 1100, 960];
/**
 * Quality is preferred down to here; below it, WIDTH gives way instead. 66 is
 * where WebP starts showing blocking on the smooth mid-tones this palette
 * grades everything into, and a soft 960px backdrop reads better than a
 * blocky 1600px one at the same byte cost.
 */
const SOFT_QUALITY_FLOOR = 66;
/** The narrowest top step. Below this the 960 ladder rung has nothing above it. */
const TOP_STEP_FLOOR = 960;

/**
 * Spec §10 item 6 and the §16 gate: "hero transfer 180KB or less".
 *
 * Applied as a GLOBAL per-file ceiling, not a hero-only one. The spec names
 * the hero because the hero is the LCP element, but a 418 KB backdrop behind
 * a pull quote on the same 4G connection is strictly worse than a 180 KB
 * hero, and several of the supplied originals are exactly that. Nothing on
 * any route may exceed the budget the spec sets for the most important image
 * on the site. No new number is invented here — it is the spec's own figure.
 *
 * 180 * 1000, not 180 * 1024. "180KB" is ambiguous and the difference is
 * 4,320 bytes, which is exactly the band the pilot's hero landed in at the
 * first attempt: 181,088 bytes passes a KiB reading and fails a decimal one.
 * A gate that 38 sites have to clear should not turn on which reading the
 * reviewer has in mind, so it takes the stricter one.
 */
const BUDGET_BYTES = 180 * 1000;
/** Quality floor for the budget search. Below this the §10 grade bands. */
const MIN_QUALITY = 50;

const SOURCE_EXT = /\.(jpe?g|png)$/i;

/* ── helpers ─────────────────────────────────────────────────────────── */

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const log = (...a) => console.log(...a);

function fail(msg) {
  console.error(`\n  optimise-images: ${msg}\n`);
  process.exit(1);
}

const webpOpts = (quality) => ({ quality, effort: 6, smartSubsample: true });
const jpegOpts = (quality) => ({ quality, mozjpeg: true, progressive: true });

/**
 * The widths emitted for one image, given the top step chosen for it. Ladder
 * rungs at or above the top are dropped, so the browser is never handed an
 * upscale and never handed two files of the same size.
 */
function ladderFor(top) {
  return [...LADDER.filter((w) => w < top), top];
}

/**
 * Which filename is the hero. Read from site.ts by regex rather than by
 * importing it: site.ts pulls in ./types and is not my file, and a build-time
 * script that can be broken by an unrelated edit to a config module is a
 * propagation hazard. A miss is non-fatal — no image gets the budget search,
 * and the run says so.
 */
function heroName() {
  try {
    const src = fs.readFileSync(SITE_TS, 'utf8');
    const m = src.match(/["']?hero["']?\s*:\s*["']([^"']+\.(?:jpe?g|png))["']/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Every image filename site.ts claims to have. Used only to assert at the end
 * that the config cannot reference an asset the pipeline did not produce —
 * the failure mode that ships a 404 to production on one of 38 sites.
 */
function referencedNames() {
  const names = new Set();
  try {
    const src = fs.readFileSync(SITE_TS, 'utf8');
    for (const m of src.matchAll(/["']([\w.@-]+\.(?:jpe?g|png))["']/gi)) names.add(m[1]);
  } catch { /* config unreadable: the assertion simply has nothing to assert */ }
  return names;
}

/* ── first run: rescue the originals out of publicDir ────────────────── */

/**
 * public/images/ starts as a folder of originals and ends as a folder of
 * build products. The move happens exactly once; afterwards ORIGINALS_DIR is
 * authoritative and public/images/ is disposable.
 *
 * The guard is `ORIGINALS_DIR does not exist`. It cannot misfire on a second
 * run and swallow generated files, because by then the directory is there.
 */
function bootstrapOriginals() {
  if (fs.existsSync(ORIGINALS_DIR)) return false;
  if (!fs.existsSync(OUT_DIR)) fail(`neither ${ORIGINALS_DIR} nor ${OUT_DIR} exists — nothing to do`);

  const originals = fs.readdirSync(OUT_DIR).filter((f) => SOURCE_EXT.test(f));
  if (!originals.length) fail(`${OUT_DIR} holds no source images and ${ORIGINALS_DIR} does not exist`);

  fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
  let bytes = 0;
  for (const f of originals) {
    const from = path.join(OUT_DIR, f);
    bytes += fs.statSync(from).size;
    fs.renameSync(from, path.join(ORIGINALS_DIR, f));
  }
  log(`  · first run: moved ${originals.length} originals (${kb(bytes)}) to assets-src/images/`);
  log('    they are the source of truth from now on and are never shipped.');
  return true;
}

/* ── the budget search ───────────────────────────────────────────────── */

/**
 * Encode at the highest quality that fits BUDGET_BYTES.
 *
 * A fixed quality cannot honour a byte budget: the supplied originals differ
 * by a factor of twenty in noise, and noise is what a photographic codec
 * spends its bits on. At a flat q74 the pilot's own `img-20.jpg` came out at
 * 418 KB — over twice the spec's ceiling — while `img-13.jpg` came out at
 * 21 KB. Quality is therefore the free variable and bytes are the constant,
 * which is the way round the performance gate is written.
 *
 * Linear walk down in steps of 2 rather than a binary search: the curve is
 * monotonic but shallow, the space is ~12 points, and a walk lands on the
 * highest passing quality exactly rather than near it. The overwhelmingly
 * common case is one encode, because most steps fit at the first try.
 */
async function walkQuality(pipeline, format, start, floor) {
  const opts = format === 'webp' ? webpOpts : jpegOpts;
  for (let quality = start; quality >= floor; quality -= 2) {
    const buf = await pipeline.clone()[format](opts(quality)).toBuffer();
    if (buf.length <= BUDGET_BYTES) return { buf, quality };
  }
  return null;
}

async function encodeToBudget(pipeline, format, label) {
  const start = format === 'webp' ? WEBP_QUALITY : JPEG_QUALITY;
  const hit = await walkQuality(pipeline, format, start, MIN_QUALITY);
  if (hit) return hit;
  fail(
    `${label} will not fit the ${kb(BUDGET_BYTES)} ceiling even at quality ${MIN_QUALITY} (spec §10 item 6).\n` +
    `  The source is too noisy. Denoise or crop the original in assets-src/images/.`,
  );
}

/**
 * Choose the top ladder step for one image.
 *
 * Bytes are the constant, so SOMETHING has to give, and the order matters.
 * Quality gives first, but only to `SOFT_QUALITY_FLOOR`; past that, width
 * gives instead. That order is the whole judgement in this script.
 *
 * Four of the pilot's originals are film-grain noisy enough that 1600px
 * cannot be made to fit 180 KB at any quality worth shipping — `img-18.jpg`
 * is 315 KB even at q60. Blocking artefacts survive the §10 grade and grain
 * and read as a broken photograph; a 960px source upscaled into a full-bleed
 * band reads as a soft photograph, which is what the grade was going to do to
 * the fine detail anyway. So those images ship narrower rather than uglier.
 *
 * Returns the chosen width together with the buffer already encoded at it, so
 * the caller never pays for the search twice.
 */
async function resolveTopStep(input, intrinsicWidth, label) {
  const ceiling = Math.min(intrinsicWidth, MAX_WIDTH);
  const floor = Math.min(TOP_STEP_FLOOR, ceiling);
  const candidates = [ceiling, ...TOP_CANDIDATES.filter((w) => w < ceiling && w >= floor)];

  for (const width of [...new Set(candidates)]) {
    const resized = input.clone().resize({ width, withoutEnlargement: true, fit: 'inside' });
    const hit = await walkQuality(resized, 'webp', WEBP_QUALITY, SOFT_QUALITY_FLOOR);
    if (hit) return { width, ...hit };
  }

  /* Nothing fit above the soft floor. Take the narrowest candidate and spend
     the remaining quality range on it rather than shrinking further. */
  const narrowest = Math.min(...candidates);
  const resized = input.clone().resize({ width: narrowest, withoutEnlargement: true, fit: 'inside' });
  const hit = await walkQuality(resized, 'webp', SOFT_QUALITY_FLOOR - 2, MIN_QUALITY);
  if (hit) return { width: narrowest, ...hit };

  /* Still nothing. This happens when the SOURCE is already at or below
     TOP_STEP_FLOOR, which the ladder above cannot handle: `candidates` collapses
     to the single intrinsic width, so there is no narrower rung to try. Six of
     the estate's 38 repos hit exactly this, with noisy originals between 810 and
     960px that miss 180 KB even at quality 50.
     Bytes stay the hard constraint, because this is the LCP request and a visitor
     on a Cornish 4G signal pays for every one of them; intrinsic resolution is the
     soft one, and the §10 grade and grain soften fine detail regardless. So the
     width keeps giving, in 12% steps, down to the 480 base rung. Below that the
     top step would be narrower than the smallest ladder rung and there would be
     nothing left to serve. */
  for (let width = Math.round(narrowest * 0.88); width > LADDER[0]; width = Math.round(width * 0.88)) {
    const step = input.clone().resize({ width, withoutEnlargement: true, fit: 'inside' });
    const found = await walkQuality(step, 'webp', SOFT_QUALITY_FLOOR, MIN_QUALITY);
    if (found) return { width, ...found };
  }
  const base = input.clone().resize({ width: LADDER[0], withoutEnlargement: true, fit: 'inside' });
  const last = await walkQuality(base, 'webp', SOFT_QUALITY_FLOOR, MIN_QUALITY);
  if (last) return { width: LADDER[0], ...last };

  fail(
    `${label} will not fit the ${kb(BUDGET_BYTES)} ceiling even at ${LADDER[0]}px and quality ${MIN_QUALITY}\n` +
    `  (spec §10 item 6). Denoise or crop the original in assets-src/images/.`,
  );
}

/* ── main ────────────────────────────────────────────────────────────── */

/**
 * --check: does the shipped output still match the originals? Verifies
 * without re-encoding, so it is instant and safe to wire into CI. It answers
 * the propagation question that actually bites — "did someone add a photo to
 * assets-src/ and forget to run the pipeline" — rather than re-deriving bytes.
 */
function check() {
  if (!fs.existsSync(ORIGINALS_DIR)) {
    fail('--check requires assets-src/images/. Run the script without --check first.');
  }
  if (!fs.existsSync(MANIFEST_TS)) fail('src/config/images.ts is missing. Run the script.');

  const manifestSrc = fs.readFileSync(MANIFEST_TS, 'utf8');
  const originals = fs.readdirSync(ORIGINALS_DIR).filter((f) => SOURCE_EXT.test(f)).sort();
  const problems = [];

  for (const file of originals) {
    const stem = file.replace(SOURCE_EXT, '');
    const entry = manifestSrc.match(
      new RegExp(`${JSON.stringify(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*\\{([^}]*)\\}`),
    );
    if (!entry) { problems.push(`${file}: no manifest entry — the pipeline has not been run since it was added`); continue; }

    const webp = (entry[1].match(/webp:\s*\[([^\]]*)\]/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const jpeg = (entry[1].match(/jpeg:\s*\[([^\]]*)\]/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);

    for (const w of webp) if (!fs.existsSync(path.join(OUT_DIR, `${stem}-${w}.webp`))) problems.push(`missing ${stem}-${w}.webp`);
    for (const w of jpeg) if (!fs.existsSync(path.join(OUT_DIR, `${stem}-${w}.jpg`))) problems.push(`missing ${stem}-${w}.jpg`);
    if (!fs.existsSync(path.join(OUT_DIR, `${stem}.jpg`))) problems.push(`missing ${stem}.jpg (the universal fallback)`);
  }

  const missing = [...referencedNames()].filter((n) => !manifestSrc.includes(JSON.stringify(n) + ':'));
  for (const n of missing) problems.push(`src/config/site.ts references ${n}, which the pipeline never produced`);

  if (problems.length) fail(`image pipeline out of date:\n  ${problems.join('\n  ')}`);
  log(`  · check passed: ${originals.length} originals, all variants present, manifest in sync\n`);
}

async function run() {
  log('\n  optimise-images — WebP ladder + JPEG fallback, in place\n');

  if (CHECK_ONLY) { check(); return; }

  const moved = bootstrapOriginals();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const originals = fs.readdirSync(ORIGINALS_DIR).filter((f) => SOURCE_EXT.test(f)).sort();
  if (!originals.length) fail(`${ORIGINALS_DIR} holds no source images`);

  const hero = heroName();
  log(`  · ${originals.length} originals · hero: ${hero ?? '(not found in site.ts — no budget search)'}\n`);

  const manifest = {};
  const problems = [];
  let originalBytes = 0;
  let emittedBytes = 0;
  let emittedFiles = 0;
  let heroReport = null;

  for (const file of originals) {
    const srcPath = path.join(ORIGINALS_DIR, file);
    const stem = file.replace(SOURCE_EXT, '');
    const isHero = hero === file;
    originalBytes += fs.statSync(srcPath).size;

    const input = sharp(srcPath, { failOn: 'error' });
    const meta = await input.metadata();
    if (!meta.width || !meta.height) { problems.push(`${file}: unreadable dimensions`); continue; }

    /* The top step is resolved first, because it can come back narrower than
       the intrinsic width when the budget cannot be met — and the rest of the
       ladder is defined relative to whatever it settles on. */
    const chosen = await resolveTopStep(input, meta.width, `${stem} top step`);
    const top = chosen.width;
    const topHeight = Math.round((meta.height / meta.width) * top);
    const widths = ladderFor(top);

    const written = [];
    const webpWidths = [];
    const jpegWidths = [];

    for (const w of widths) {
      const isTop = w === top;
      const resized = input.clone().resize({ width: w, withoutEnlargement: true, fit: 'inside' });

      /* WebP: the whole ladder. The top step is already encoded — reuse it
         rather than paying for the resolved search a second time. */
      const webpName = `${stem}-${w}.webp`;
      const webp = isTop ? chosen : await encodeToBudget(resized, 'webp', webpName);
      fs.writeFileSync(path.join(OUT_DIR, webpName), webp.buf);
      webpWidths.push(w);
      written.push([webpName, webp.buf.length]);
      if (isHero && isTop) heroReport = { ...(heroReport ?? {}), webp: { file: webpName, quality: webp.quality, bytes: webp.buf.length } };

      /* JPEG: the top step keeps the ORIGINAL FILENAME so every pre-existing
         reference in the repo resolves untouched; the sparse ladder below it
         covers the no-WebP mobile case. */
      if (!isTop && !JPEG_LADDER.includes(w)) continue;

      const jpegName = isTop ? `${stem}.jpg` : `${stem}-${w}.jpg`;
      const jpeg = await encodeToBudget(resized, 'jpeg', jpegName);
      fs.writeFileSync(path.join(OUT_DIR, jpegName), jpeg.buf);
      if (!isTop) jpegWidths.push(w);
      written.push([jpegName, jpeg.buf.length]);
      if (isHero && isTop) heroReport = { ...(heroReport ?? {}), jpeg: { file: jpegName, quality: jpeg.quality, bytes: jpeg.buf.length } };
    }

    for (const [, size] of written) { emittedBytes += size; emittedFiles += 1; }

    manifest[file] = {
      w: top,
      h: topHeight,
      webp: webpWidths,
      jpeg: jpegWidths,
    };

    const topWebp = written.find(([n]) => n === `${stem}-${top}.webp`);
    log(
      `    ${file.padEnd(14)} ${meta.width}x${meta.height}`.padEnd(34) +
      `→ ${top}px  ${widths.length} webp + ${jpegWidths.length + 1} jpg` +
      `   top webp ${kb(topWebp[1]).padStart(9)}${isHero ? '   ← HERO' : ''}`,
    );
  }

  if (problems.length) fail(problems.join('\n  '));

  /* ── assert nothing the config names went unproduced ─────────────────
     A filename in site.ts with no manifest entry is a guaranteed 404 on a
     live route. It is cheap to catch here and expensive to catch in prod. */
  const missing = [...referencedNames()].filter((n) => !manifest[n]);
  if (missing.length) {
    fail(`src/config/site.ts references images that were not produced:\n  ${missing.join('\n  ')}`);
  }

  /* ── the manifest ───────────────────────────────────────────────────── */
  writeManifest(manifest);

  /* ── report ─────────────────────────────────────────────────────────── */
  const publicBytes = fs.readdirSync(OUT_DIR)
    .map((f) => fs.statSync(path.join(OUT_DIR, f)))
    .filter((s) => s.isFile())
    .reduce((a, s) => a + s.size, 0);

  log('');
  log(`  originals (assets-src/images/)  ${String(originals.length).padStart(3)} files  ${kb(originalBytes).padStart(10)}`);
  log(`  emitted   (public/images/)      ${String(emittedFiles).padStart(3)} files  ${kb(emittedBytes).padStart(10)}`);
  log(`  public/images/ total                       ${kb(publicBytes).padStart(10)}`);
  if (heroReport?.webp) {
    const orig = fs.statSync(path.join(ORIGINALS_DIR, hero)).size;
    log('');
    log(`  HERO ${hero}  —  ${kb(orig)} as supplied`);
    log(`    ${heroReport.webp.file.padEnd(20)} ${kb(heroReport.webp.bytes).padStart(9)}  q${heroReport.webp.quality}  top step, budget ${kb(BUDGET_BYTES)}`);
    if (heroReport.jpeg) {
      log(`    ${heroReport.jpeg.file.padEnd(20)} ${kb(heroReport.jpeg.bytes).padStart(9)}  q${heroReport.jpeg.quality}  no-WebP fallback`);
    }
    const saved = orig - heroReport.webp.bytes;
    log(`    saving ${kb(saved)} (${((saved / orig) * 100).toFixed(1)}%) on the LCP request at full desktop width`);
    const m = manifest[hero];
    const small = m && m.webp.length > 1 ? m.webp[0] : null;
    if (small) {
      const smallBytes = fs.statSync(path.join(OUT_DIR, `${hero.replace(SOURCE_EXT, '')}-${small}.webp`)).size;
      log(`    a 390px phone at DPR 1 fetches ${hero.replace(SOURCE_EXT, '')}-${small}.webp instead: ${kb(smallBytes)}`);
    }
  }
  if (moved) log('\n  Commit assets-src/images/ — it is now the only copy of the originals.');
  log('');
}

/* ── manifest emitter ────────────────────────────────────────────────── */

function writeManifest(manifest) {
  const entries = Object.keys(manifest).sort().map((k) => {
    const v = manifest[k];
    return `  ${JSON.stringify(k)}: { w: ${v.w}, h: ${v.h}, webp: [${v.webp.join(', ')}], jpeg: [${v.jpeg.join(', ')}] },`;
  }).join('\n');

  const body = `/* GENERATED BY scripts/optimise-images.mjs — DO NOT EDIT BY HAND.
 *
 * The responsive variants that exist on disk under /images/, keyed by the
 * ORIGINAL filename, which is the name src/config/site.ts still uses. <Img>
 * reads this to build srcset and to emit width/height for CLS (spec §14).
 *
 * \`w\`/\`h\`  intrinsic size of the top step. Aspect ratio only — the CSS
 *          decides the rendered box everywhere in this system.
 * \`webp\`  widths available as \`NAME-<w>.webp\`.
 * \`jpeg\`  widths available as \`NAME-<w>.jpg\`. The top width is NOT listed:
 *          it is the file named after the original, e.g. \`img-00.jpg\`, so a
 *          repo that never adopts <Img> still resolves every existing src.
 *
 * A filename absent from this map is not an error. <Img> falls back to a
 * plain <img src="/images/NAME"> — which is exactly what the site did before
 * this pipeline existed, so an unprocessed asset degrades, never breaks.
 */

export interface ImageVariants {
  /** Intrinsic width of the largest emitted step. */
  w: number;
  /** Intrinsic height of the largest emitted step. */
  h: number;
  /** Widths emitted as \`NAME-<w>.webp\`. */
  webp: number[];
  /** Widths emitted as \`NAME-<w>.jpg\`, excluding the top step. */
  jpeg: number[];
}

export const IMAGE_MANIFEST: Record<string, ImageVariants> = {
${entries}
};
`;
  fs.writeFileSync(MANIFEST_TS, body);
  log(`\n  · wrote src/config/images.ts (${Object.keys(manifest).length} entries)`);
}

run().catch((err) => fail(err?.stack || String(err)));
