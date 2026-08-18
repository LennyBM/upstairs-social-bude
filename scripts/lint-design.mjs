#!/usr/bin/env node
/**
 * lint-design.mjs — design system enforcement gate (DESIGN-SYSTEM-SPEC.md §14).
 *
 * Node >= 18, ESM, zero dependencies beyond what the repo already installs.
 * Copied verbatim into every repo in the estate. Run: `npm run lint:design`.
 * Exits 1 on any violation and prints `file:line:col  [rule]  message`.
 *
 * ── What it enforces ────────────────────────────────────────────────────────
 *  §14.1  Banned utilities in JSX, INCLUDING the Tailwind 4 CSS variable
 *         shorthand that the spec's plain grep cannot see:
 *             rounded-(--r-md)   rounded-[var(--r-full)]
 *             tracking-(--tracking-label)   text-(color:--token)
 *         Those forms are legal only when the custom property they name is
 *         actually DECLARED in the project CSS. `rounded-[8px]`,
 *         `tracking-(--invented)` and `text-(color:--anything)` are violations.
 *         The allowlist is derived by reading the CSS, never hardcoded, so it
 *         cannot drift away from the tokens the estate really ships.
 *  §14.2  Content lint over src/config/site.ts, plus the index.html meta
 *         description (the truncated-description defect shipped precisely
 *         because the lint was scoped to site.ts and stopped there).
 *  §14.3  Every class named in JSX must resolve: either a Tailwind utility or
 *         a class actually defined in the CSS. An undefined class builds clean
 *         and renders broken, which is the failure mode nothing else catches.
 *
 * ── Honoured exceptions (a noisy gate gets switched off) ────────────────────
 *  · `not-italic` is not `italic`.
 *  · `text-center` is permitted inside a `.card` and inside archetype E
 *    (§8: the full-bleed graded-media quote section), and inside a
 *    prop-gated conditional, where the enforcement point is the call site.
 *  · Words inside comments and doc strings are not classes. The scanner masks
 *    comments and only reads string literals that sit in class position inside
 *    a `className` attribute — never a comparison operand, never a doc block.
 *  · An explicit `design-lint-allow: <rule>` comment on one of the three
 *    preceding lines suppresses a single occurrence.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

/* ══════════════════════════════════════════════════════════════════════════
   reporting
   ══════════════════════════════════════════════════════════════════════════ */

const findings = [];
const notes = [];

function report(file, line, col, rule, message) {
  findings.push({ file: rel(file), line, col, rule, message });
}
function rel(p) {
  return relative(ROOT, p).split(sep).join('/');
}
function posOf(text, index) {
  const upto = text.slice(0, index);
  const line = upto.split('\n').length;
  const col = index - (upto.lastIndexOf('\n') + 1) + 1;
  return { line, col };
}
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════
   1. source scanner
   Produces a `code` view (same length as the source, with comment bodies and
   string CONTENTS blanked) plus every string literal with its offset. Brace
   matching and keyword search run on `code`, so a brace, a `className` or a
   banned word inside a comment or a doc string can never be mistaken for real
   markup. Regex literals are skipped so an apostrophe inside one cannot
   desynchronise the string scanner.
   ══════════════════════════════════════════════════════════════════════════ */

const REGEX_PRECEDERS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', ';', '+', '-', '*', '%', '~', '^', '>']);

function scanSource(src) {
  const code = src.split('');
  const strings = [];
  const blank = (from, to) => { for (let k = from; k < to && k < src.length; k++) if (src[k] !== '\n') code[k] = ' '; };
  let i = 0;
  let prevSignificant = '';
  let prevChar = '';

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];

    if (c === '/' && n === '/') {
      let j = i; while (j < src.length && src[j] !== '\n') j++;
      blank(i, j); i = j; continue;
    }
    if (c === '/' && n === '*') {
      let j = i + 2;
      while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j++;
      j = Math.min(j + 2, src.length);
      blank(i, j); i = j; continue;
    }
    if (c === '/' && n !== '>' && prevChar !== '<' && REGEX_PRECEDERS.has(prevSignificant)) {
      // regular expression literal
      let j = i + 1, cls = false;
      for (; j < src.length; j++) {
        const ch = src[j];
        if (ch === '\\') { j++; continue; }
        if (ch === '[') cls = true;
        else if (ch === ']') cls = false;
        else if (ch === '/' && !cls) break;
        else if (ch === '\n') { j = i; break; }   // not a regex after all
      }
      if (j > i) { blank(i, j + 1); i = j + 1; prevSignificant = '/'; prevChar = '/'; continue; }
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      let value = '';
      while (j < src.length) {
        if (src[j] === '\\') { value += '  '; j += 2; continue; }
        if (src[j] === quote) break;
        if (quote === '`' && src[j] === '$' && src[j + 1] === '{') {
          let depth = 0, k = j + 1;
          for (; k < src.length; k++) {
            if (src[k] === '{') depth++;
            else if (src[k] === '}') { depth--; if (!depth) break; }
          }
          value += ' '.repeat(k - j + 1);
          j = k + 1;
          continue;
        }
        value += src[j];
        j++;
      }
      blank(i + 1, j);
      strings.push({ start: i, inner: i + 1, end: j, value, quote });
      i = j + 1;
      prevSignificant = quote; prevChar = quote;
      continue;
    }
    if (!/\s/.test(c)) prevSignificant = c;
    prevChar = c;
    i++;
  }
  return { code: code.join(''), strings };
}

/* Extract the string literals that are genuinely class lists: the ones that sit
   in class position inside a `className` / `class` attribute. */
const NOT_CLASS_BEFORE = /(?:[=!<>]=*|\.(?:includes|startsWith|endsWith|indexOf|lastIndexOf|match|matchAll|replace|replaceAll|split|test|search)\s*\()\s*$/;

function classLiterals(src) {
  const { code, strings } = scanSource(src);
  const out = [];
  const attr = /\bclass(?:Name)?\s*=\s*/g;
  let m;
  while ((m = attr.exec(code))) {
    const at = m.index + m[0].length;
    const ch = code[at];
    let from, to;
    if (ch === '"' || ch === "'" || ch === '`') {
      const lit = strings.find((s) => s.start === at);
      if (!lit) continue;
      out.push({ ...lit, region: [at, lit.end] });
      continue;
    }
    if (ch !== '{') continue;
    let depth = 0, j = at;
    for (; j < code.length; j++) {
      if (code[j] === '{') depth++;
      else if (code[j] === '}') { depth--; if (!depth) break; }
    }
    from = at; to = j;
    for (const lit of strings) {
      if (lit.start < from || lit.end > to) continue;
      const before = code.slice(from, lit.start);
      if (NOT_CLASS_BEFORE.test(before)) continue;          // comparison operand
      if (/^\s*\]/.test(code.slice(lit.end + 1))) continue; // index access
      out.push({ ...lit, region: [from, to] });
    }
  }
  return { code, literals: out, strings };
}

/* Strip Tailwind variant prefixes (`hover:`, `lg:`, `min-[400px]:`, `!`)
   bracket- and paren-aware, so the colon inside `text-(color:--x)` is safe. */
function baseOf(token) {
  let t = token;
  if (t.startsWith('!')) t = t.slice(1);
  let depth = 0, cut = -1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (c === ':' && depth === 0) cut = i;
  }
  t = cut === -1 ? t : t.slice(cut + 1);
  if (t.endsWith('!')) t = t.slice(0, -1);
  return t;
}

/* Split `rounded-[8px]` / `text-(color:--x)` into utility + arbitrary payload. */
function arbitraryOf(base) {
  const last = base[base.length - 1];
  const open = last === ')' ? '(' : last === ']' ? '[' : null;
  if (!open) return null;
  const close = last;
  let depth = 0;
  for (let i = base.length - 1; i >= 0; i--) {
    if (base[i] === close) depth++;
    else if (base[i] === open) {
      depth--;
      if (depth === 0) {
        if (i === 0 || base[i - 1] !== '-') return null;
        return { util: base.slice(0, i - 1), inner: base.slice(i + 1, base.length - 1), open };
      }
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   2. the allowlist, derived from the CSS the repo actually ships
   ══════════════════════════════════════════════════════════════════════════ */

const cssVars = new Set();     // every --custom-property DECLARED
const cssClasses = new Set();  // every .class DEFINED
const cssFiles = walk(SRC).filter((f) => f.endsWith('.css'));

for (const file of cssFiles) {
  const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const m of text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) cssVars.add(m[1]);
  // Selectors are the text immediately before an opening brace.
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      for (const m of buf.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) cssClasses.add(m[1]);
      buf = '';
    } else if (c === '}' || c === ';') buf = '';
    else buf += c;
  }
}

if (!cssVars.size || !cssClasses.size) {
  console.error('lint:design — could not read the project CSS under src/. Aborting rather than passing blind.');
  process.exit(2);
}

/* ══════════════════════════════════════════════════════════════════════════
   3. Tailwind oracle — is this candidate a real utility?
   Uses the tailwindcss already installed in the repo, so the list of valid
   utilities can never drift from the version that builds the site. If the API
   is unavailable the gate falls back to a namespace table and says so loudly,
   because a silently weakened gate is the thing this file exists to prevent.
   ══════════════════════════════════════════════════════════════════════════ */

let isUtility = null;
let oracleMode = 'fallback';

try {
  const require_ = createRequire(join(ROOT, 'package.json'));
  const mod = await import(pathToFileURL(require_.resolve('tailwindcss')).href);
  const tw = mod.__unstable__loadDesignSystem ? mod : mod.default;
  const entry = ['src/index.css', 'src/styles/index.css', 'src/main.css']
    .map((p) => join(ROOT, p)).find(existsSync);
  if (!tw?.__unstable__loadDesignSystem || !entry) throw new Error('no entry stylesheet');

  const loadStylesheet = (id, base) => {
    let path;
    if (id.startsWith('.') || id.startsWith('/')) path = resolve(base, id);
    else {
      for (const candidate of id.endsWith('.css') ? [id] : [`${id}/index.css`, `${id}.css`, id]) {
        try { path = require_.resolve(candidate); break; } catch { /* next */ }
      }
    }
    if (!path) throw new Error(`cannot resolve stylesheet ${id}`);
    return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
  };

  const design = await tw.__unstable__loadDesignSystem(readFileSync(entry, 'utf8'), {
    base: dirname(entry),
    loadStylesheet,
    loadModule: () => { throw new Error('plugins are not loaded by the design lint'); },
  });
  const memo = new Map();
  isUtility = (token) => {
    if (memo.has(token)) return memo.get(token);
    let ok = false;
    try { ok = Boolean(design.candidatesToCss([token])[0]); } catch { ok = false; }
    memo.set(token, ok);
    return ok;
  };
  oracleMode = 'tailwind';
} catch (err) {
  notes.push(`Tailwind utility oracle unavailable (${String(err.message).split('\n')[0]}); falling back to the namespace table. `
    + 'Undefined-class detection is weaker in this mode.');
}

/* Fallback: Tailwind 4 utility namespaces. Only consulted when the compiler
   above cannot be loaded. Extend rather than delete. */
const TW_PREFIXES = [
  'accent-', 'align-', 'animate-', 'appearance-', 'aspect-', 'auto-cols-', 'auto-rows-', 'backdrop-',
  'basis-', 'bg-', 'blur', 'border', 'bottom-', 'box-', 'break-', 'brightness-', 'caption-', 'caret-',
  'clear-', 'col-', 'columns-', 'contrast-', 'cursor-', 'decoration-', 'delay-', 'divide-', 'drop-shadow',
  'duration-', 'ease-', 'end-', 'field-sizing-', 'fill-', 'filter', 'flex', 'float-', 'font-', 'forced-',
  'gap-', 'grayscale', 'grid-', 'grow', 'h-', 'hue-rotate-', 'indent-', 'inset-', 'invert', 'items-',
  'justify-', 'leading-', 'left-', 'line-clamp-', 'list-', 'm-', 'mask-', 'max-h-', 'max-w-', 'mb-', 'me-',
  'min-h-', 'min-w-', 'ml-', 'mr-', 'ms-', 'mt-', 'mx-', 'my-', 'object-', 'opacity-', 'order-', 'origin-',
  'outline', 'overflow-', 'overscroll-', 'p-', 'pb-', 'pe-', 'perspective-', 'pl-', 'place-', 'pointer-events-',
  'pr-', 'ps-', 'pt-', 'px-', 'py-', 'resize', 'right-', 'ring', 'rotate-', 'rounded', 'row-', 'saturate-',
  'scale-', 'scroll-', 'select-', 'sepia', 'shadow', 'shrink', 'size-', 'skew-', 'snap-', 'space-x-',
  'space-y-', 'start-', 'stroke-', 'sr-only', 'table-', 'text-', 'top-', 'touch-', 'tracking-', 'transform',
  'transition', 'translate-', 'truncate', 'underline', 'uppercase', 'w-', 'whitespace-', 'will-change-', 'z-',
];
const TW_WORDS = new Set([
  'absolute', 'antialiased', 'block', 'capitalize', 'collapse', 'contents', 'fixed', 'flex', 'flow-root',
  'grid', 'group', 'hidden', 'inline', 'inline-block', 'inline-flex', 'inline-grid', 'inline-table',
  'invisible', 'isolate', 'italic', 'list-item', 'lowercase', 'normal-case', 'not-italic', 'not-sr-only',
  'overline', 'peer', 'relative', 'static', 'sticky', 'subpixel-antialiased', 'table', 'underline',
  'uppercase', 'visible', 'container',
]);
const fallbackIsUtility = (token) => {
  const b = baseOf(token).replace(/^-/, '');   // negative utilities: -mr-3
  return TW_WORDS.has(b) || TW_PREFIXES.some((p) => b === p.replace(/-$/, '') || b.startsWith(p));
};

/* ══════════════════════════════════════════════════════════════════════════
   4. §14.1 — banned in JSX
   ══════════════════════════════════════════════════════════════════════════ */

const RAW_RADIUS = /^rounded(-(s|e|t|r|b|l|ss|se|es|ee|tl|tr|br|bl))?(-(none|xs|sm|md|lg|xl|2xl|3xl|4xl|full))?$/;
const RAW_SHADOW = /^shadow(-(2xs|xs|sm|md|lg|xl|2xl|inner))?$/;
const RAW_TRACKING = /^tracking-(tighter|tight|normal|wide|wider|widest)$/;
const RAW_TEXT_SIZE = /^text-(xs|sm|base|lg|xl|[2-9]xl)$/;
const RAW_FONT = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono)$/;
const RAW_LEADING = /^leading-(none|tight|snug|normal|relaxed|loose|\d+(\.\d+)?)$/;
const TEXT_TINT = /^text-[A-Za-z][\w-]*\/\d/;
/* Variant markers emit no CSS of their own, so the utility oracle reports them
   as unknown. They are still legitimate classes. */
const TW_MARKER = /^(group|peer)(\/[\w-]+)?$/;

/* Utilities whose value the design system governs: an arbitrary value here must
   name a declared token, never a literal. Everything else (bg-[#25D366] for the
   WhatsApp mark, aspect-[4/3], max-w-[90vw]) is outside §14.1 and left alone. */
const GOVERNED = ['rounded', 'shadow', 'drop-shadow', 'text-shadow', 'text', 'tracking', 'leading', 'font'];
const isGoverned = (util) => GOVERNED.some((g) => util === g || util.startsWith(`${g}-`));

function suppressed(src, index, rule) {
  const { line } = posOf(src, index);
  const lines = src.split('\n');
  for (let l = Math.max(0, line - 4); l < line; l++) {
    const m = lines[l] && lines[l].match(/design-lint-allow:\s*([\w-]+)/);
    if (m && (m[1] === rule || m[1] === 'all')) return true;
  }
  return false;
}

/* `text-center` is permitted inside a .card and inside archetype E (§8). */
function textCenterAllowed({ src, code, literal, tokens }) {
  if (tokens.includes('card')) return true;

  // Archetype E: the nearest enclosing <section> carries the graded media stack.
  const before = code.slice(0, literal.start);
  const openTag = before.lastIndexOf('<section');
  if (openTag !== -1) {
    const tagEnd = code.indexOf('>', openTag);
    const tag = src.slice(openTag, tagEnd === -1 ? openTag + 200 : tagEnd);
    const body = src.slice(openTag, literal.start);
    if (/\bmedia\b/.test(tag) && /media-scrim|media-grade/.test(body)) return true;
  }

  // Prop-gated: `center && 'text-center'`. The enforcement point is the call
  // site, not the primitive, so the primitive is not a violation.
  const guard = code.slice(literal.region[0], literal.start).match(/([A-Za-z_$][\w$]*)\s*(?:&&|\?)\s*$/);
  if (guard) {
    const id = guard[1];
    if (new RegExp(`[{,]\\s*${id}\\s*[=,}:]`).test(code)) return true;
  }
  return false;
}

const tsxFiles = walk(SRC).filter((f) => f.endsWith('.tsx'));

/* Custom properties written from JS (`style={{ '--focal': … }}`) count as
   declared for the purposes of var() reference checking. */
const jsDeclaredVars = new Set();
const parsed = new Map();
for (const file of tsxFiles) {
  const src = readFileSync(file, 'utf8');
  const info = classLiterals(src);
  parsed.set(file, { src, ...info });
  for (const lit of info.strings) {
    const v = lit.value.trim();
    if (/^--[A-Za-z0-9_-]+$/.test(v)) jsDeclaredVars.add(v);
  }
}
const knownVar = (name) => cssVars.has(name) || jsDeclaredVars.has(name);

for (const file of tsxFiles) {
  const { src, code, literals, strings } = parsed.get(file);

  for (const literal of literals) {
    let cursor = 0;
    for (const raw of literal.value.split(/\s+/)) {
      const offset = literal.value.indexOf(raw, cursor);
      cursor = offset + raw.length;
      const token = raw.trim();
      if (!token) continue;

      const index = literal.inner + offset;
      const { line, col } = posOf(src, index);
      const tokens = literal.value.split(/\s+/).filter(Boolean).map(baseOf);
      const base = baseOf(token);
      const flag = (rule, message) => {
        if (!suppressed(src, index, rule)) report(file, line, col, rule, `${message}  →  \`${token}\``);
      };

      /* ── raw Tailwind scales (the spec's own grep) ── */
      if (RAW_RADIUS.test(base)) flag('radius', 'raw Tailwind radius utility; use rounded-(--r-sm|--r-md|--r-full) (§7)');
      else if (base !== 'shadow-none' && RAW_SHADOW.test(base)) flag('shadow', 'raw Tailwind shadow utility; the system has one shadow, `.float` / --shadow-float (§4)');
      else if (/^drop-shadow/.test(base) || /^text-shadow/.test(base)) flag('shadow', 'drop-shadow / text-shadow is banned; the system has one shadow (§4)');
      else if (TEXT_TINT.test(base)) flag('text-tint', 'opacity-derived text colour; use a declared text role token (§3)');
      else if (RAW_TRACKING.test(base)) flag('tracking', 'raw Tailwind tracking; tracking is carried by the .t-* size class (§2.4)');
      else if (RAW_TEXT_SIZE.test(base)) flag('text-size', 'raw Tailwind type size; every size lives on a .t-* class (§2.3)');
      else if (RAW_FONT.test(base)) flag('font', 'raw Tailwind font utility; family and weight are set by .t-* / --display-weight (§2.1, §2.2)');
      else if (RAW_LEADING.test(base)) flag('leading', 'raw Tailwind leading; line height is bound to the step (§2.5)');

      if (base === 'italic') flag('italic', 'italic is banned outside .pullquote and .logotype (§1.1). `not-italic` is fine');

      if (base === 'text-center' && !textCenterAllowed({ src, code, literal, tokens })) {
        flag('text-center', 'text-center is banned at section level; permitted inside .card and archetype E only (§8)');
      }

      /* ── the measured hole: Tailwind 4 variable shorthand ── */
      const arb = arbitraryOf(base);
      if (arb) {
        const named = [...arb.inner.matchAll(/--[A-Za-z0-9_-]+/g)].map((m) => m[0]);
        for (const name of named) {
          if (!knownVar(name)) {
            flag('unknown-token', `\`${name}\` is not declared in any CSS under src/; an undeclared custom property renders as nothing`);
          }
        }
        if (!named.length && isGoverned(arb.util)) {
          flag('hardcoded-value', `hardcoded value in a governed utility; \`${arb.util}\` must reference a declared token (§14.1)`);
        }
      }

      /* ── §14.3: the class has to exist ── */
      const known = cssClasses.has(base)
        || TW_MARKER.test(base)
        || (isUtility ? isUtility(token) || isUtility(base) : fallbackIsUtility(token));
      if (!known) {
        flag('undefined-class', 'class is neither a Tailwind utility nor defined in any CSS under src/; it will render as nothing');
      }
    }
  }

  /* var() referenced from TSX (inline styles, SVG fills) must also resolve. */
  for (const lit of strings) {
    for (const m of lit.value.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
      if (!knownVar(m[1])) {
        const { line, col } = posOf(src, lit.inner + m.index);
        report(file, line, col, 'unknown-token', `\`${m[1]}\` is referenced but declared in no CSS under src/`);
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   5. §14.2 — content lint
   ══════════════════════════════════════════════════════════════════════════ */

const CONFIG = join(SRC, 'config/site.ts');

/** Phrases that mean the copy was never finished. Research hedges only — the
 *  ordinary hedging of historical prose ("around 1965") is not a defect. */
const BANNED_CONTENT = [
  { re: /\[DRAFT\]/g, why: 'draft marker' },
  { re: /"unknown"/g, why: 'placeholder value' },
  { re: /approx\w*/gi, why: 'research hedge' },
  { re: /per Tripadvisor/gi, why: 'research hedge' },
  { re: /\bConfirm /g, why: 'instruction to the author left in the copy' },
  { re: /Historic England before publishing/gi, why: 'instruction to the author left in the copy' },
];
const HEDGES = [
  /approx\w*/i, /\bunknown\b/i, /\bcitation needed\b/i, /\bneeds? (checking|confirming|verifying)\b/i,
  /\bto be confirmed\b/i, /\bTBC\b/, /\bunverified\b/i, /\bper Tripadvisor\b/i, /\[DRAFT\]/i,
  /\bsource:\s/i, /\bwe believe\b/i, /\breportedly\b/i, /\ballegedly\b/i, /\bConfirm /,
];

if (!existsSync(CONFIG)) {
  console.error(`lint:design — ${rel(CONFIG)} not found. Aborting rather than passing blind.`);
  process.exit(2);
}

const configSrc = readFileSync(CONFIG, 'utf8');

for (const { re, why } of BANNED_CONTENT) {
  for (const m of configSrc.matchAll(re)) {
    const { line, col } = posOf(configSrc, m.index);
    report(CONFIG, line, col, 'content', `${why}: \`${m[0].trim()}\` (§14.2)`);
  }
}

/* Evaluate the config object so the structural assertions run on real values
   rather than on a regex approximation of them. */
let siteObj = null;
try {
  const { code } = scanSource(configSrc);
  const eq = code.indexOf('=', code.indexOf('export const site'));
  const start = code.indexOf('{', eq);
  let depth = 0, end = start;
  for (; end < code.length; end++) {
    if (code[end] === '{') depth++;
    else if (code[end] === '}') { depth--; if (!depth) break; }
  }
  siteObj = new Function(`return (${configSrc.slice(start, end + 1)});`)();
} catch (err) {
  report(CONFIG, 1, 1, 'content', `could not evaluate the site config for structural checks: ${err.message}`);
}

const endsTerminal = (s) => /[.!?]["'’”)\]]?$/.test(s.trim());
/* Deliberately narrow. "…" and a missing full stop are provable truncation; a
   short final word ("…in the UK.") is not, and guessing there is how a gate
   starts crying wolf. Real mid-word cut-offs are caught by endsTerminal and by
   the prefix comparison between the meta description and `intro`. */
const looksTruncated = (s) => /(…|\.\.\.)$/.test(s.trim());

if (siteObj) {
  const lineOf = (needle) => {
    const at = configSrc.indexOf(needle);
    return at === -1 ? 1 : posOf(configSrc, at).line;
  };

  const hours = Array.isArray(siteObj.openingHours) ? siteObj.openingHours : [];
  if (hours.length < 7) {
    report(CONFIG, lineOf('openingHours'), 1, 'content', `openingHours has ${hours.length} rows; §14.2 requires 7 or more`);
  }

  const intro = typeof siteObj.intro === 'string' ? siteObj.intro : '';
  if (!intro.trim()) report(CONFIG, lineOf('"intro"') || 1, 1, 'content', 'intro is empty (§14.2)');
  else if (!endsTerminal(intro)) {
    report(CONFIG, lineOf('"intro"'), 1, 'content', `intro does not end in terminal punctuation: …"${intro.slice(-40)}" (§14.2)`);
  } else if (looksTruncated(intro)) {
    report(CONFIG, lineOf('"intro"'), 1, 'content', `intro looks truncated mid word: …"${intro.slice(-40)}" (§14.2)`);
  }

  for (const [key, label] of [['history', 'history'], ['usps', 'usps']]) {
    const arr = Array.isArray(siteObj[key]) ? siteObj[key] : [];
    arr.forEach((entry, i) => {
      if (typeof entry !== 'string') return;
      for (const hedge of HEDGES) {
        if (hedge.test(entry)) {
          report(CONFIG, lineOf(entry.slice(0, 40)), 1, 'content',
            `${label}[${i}] contains a research hedge (${hedge}) (§14.2)`);
          break;
        }
      }
    });
  }

  const usps = Array.isArray(siteObj.usps) ? siteObj.usps : [];
  usps.forEach((u, i) => {
    if (typeof u !== 'string') return;
    const words = u.trim().split(/\s+/).filter(Boolean).length;
    if (words > 5) {
      report(CONFIG, lineOf(u.slice(0, 40)), 1, 'content',
        `usps[${i}] is ${words} words; §14.2 caps a <FactBar> entry at 5`);
    }
  });
}

/* Footer year must be computed. */
const FOOTER = join(SRC, 'components/Footer.tsx');
if (existsSync(FOOTER)) {
  const footer = readFileSync(FOOTER, 'utf8');
  if (!/getFullYear\s*\(\s*\)/.test(footer)) {
    report(FOOTER, 1, 1, 'content', 'footer year is not computed; §14.2 requires new Date().getFullYear()');
  }
  const hardYear = footer.match(/(?:©|&copy;|copyright)[^\n]{0,40}?\b(20\d{2})\b/i);
  if (hardYear) {
    const { line, col } = posOf(footer, hardYear.index);
    report(FOOTER, line, col, 'content', `hardcoded copyright year \`${hardYear[1]}\`; §14.2 requires a computed year`);
  }
}

/* Vestigial [DRAFT] stripping in the pages (§14.2: delete it; zero of the 38
   configs carry the marker, so the call is dead code pretending to be a guard). */
for (const file of tsxFiles) {
  const { src } = parsed.get(file);
  for (const m of src.matchAll(/\\?\[DRAFT\\?\]/g)) {
    const { line, col } = posOf(src, m.index);
    report(file, line, col, 'content', 'vestigial [DRAFT] handling; §14.2 says delete it');
  }
}

/* ── the extension the gate asked for: index.html is in scope too ────────── */
const INDEX_HTML = join(ROOT, 'index.html');
if (!existsSync(INDEX_HTML)) {
  report(INDEX_HTML, 1, 1, 'content', 'index.html not found');
} else {
  const html = readFileSync(INDEX_HTML, 'utf8');
  const tag = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
  if (!tag) {
    report(INDEX_HTML, 1, 1, 'meta-description', 'no <meta name="description"> (§14.2)');
  } else {
    const at = html.indexOf(tag[0]);
    const { line, col } = posOf(html, at);
    const contentMatch = tag[0].match(/content=["']([\s\S]*?)["']/i);
    const desc = contentMatch ? contentMatch[1].trim() : '';
    if (!desc) {
      report(INDEX_HTML, line, col, 'meta-description', 'meta description is empty (§14.2)');
    } else {
      if (desc.length < 50) {
        report(INDEX_HTML, line, col, 'meta-description', `meta description is ${desc.length} characters; too short to be a real description (§14.2)`);
      }
      if (!endsTerminal(desc)) {
        report(INDEX_HTML, line, col, 'meta-description', `meta description does not end in terminal punctuation: …"${desc.slice(-40)}" (§14.2)`);
      } else if (looksTruncated(desc)) {
        report(INDEX_HTML, line, col, 'meta-description', `meta description looks truncated mid word: …"${desc.slice(-40)}" (§14.2)`);
      }
      // The defect that shipped: the description is a cut-off prefix of the
      // config copy it is supposed to mirror.
      const intro = siteObj && typeof siteObj.intro === 'string' ? siteObj.intro.trim() : '';
      if (intro && desc !== intro) {
        const norm = (s) => s.replace(/\s+/g, ' ').trim();
        if (norm(intro).startsWith(norm(desc)) || norm(desc).startsWith(norm(intro))) {
          report(INDEX_HTML, line, col, 'meta-description',
            'meta description is a truncated copy of site.ts `intro`; mirror it verbatim or write a distinct one (§14.2)');
        }
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   6. output
   ══════════════════════════════════════════════════════════════════════════ */

const scanned = `${tsxFiles.length} tsx, ${cssFiles.length} css`;
console.log(`lint:design — ${scanned}; ${cssVars.size} declared custom properties, `
  + `${cssClasses.size} defined classes; utility oracle: ${oracleMode}`);
for (const note of notes) console.log(`  note: ${note}`);

if (!findings.length) {
  console.log('lint:design — clean.');
  process.exit(0);
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col);
let current = '';
for (const f of findings) {
  if (f.file !== current) { current = f.file; console.log(''); }
  console.log(`${f.file}:${f.line}:${f.col}  [${f.rule}]  ${f.message}`);
}
const byRule = findings.reduce((acc, f) => ({ ...acc, [f.rule]: (acc[f.rule] || 0) + 1 }), {});
console.log(`\nlint:design — ${findings.length} violation(s): `
  + Object.entries(byRule).map(([r, n]) => `${r} ${n}`).join(', '));
process.exit(1);
