import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Explicit extension: Vite's forthcoming native config loader warns on extensionless
// relative imports from this file.
import { site } from './src/config/site.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, 'dist');

/* ═════════════════════════════════════════════════════════════════════════
 * Prerendering
 *
 * These are marketing sites. Their job is to be found and to produce phone
 * calls, and until now `dist/index.html` shipped an empty `<div id="root">`:
 * with JavaScript off the whole estate was one <noscript> line. Every route,
 * phone number and opening hour was invisible to any client that does not
 * execute JS.
 *
 * `vite-plugin-prerender` was already a declared dependency and was simply
 * never registered. It is registered below. Three things about it are load
 * bearing and non obvious, so they are written down rather than discovered
 * again in 37 repos:
 *
 * 1. It must be loaded through `createRequire`. The package ships an ESM
 *    entry (`dist/index.mjs`) that calls bare `require()` at module scope,
 *    so `import vitePrerender from 'vite-plugin-prerender'` throws
 *    "require is not defined in ES module scope" the moment Vite loads this
 *    config. The CJS entry is correct and is what we take.
 *
 * 2. `build.target` must stay at or below es2019 — see the note on the
 *    build block. The prerender browser is old.
 *
 * 3. The plugin's `closeBundle` does not await its own work and swallows
 *    every error into a single console line, so a failed prerender still
 *    exits 0 with empty shells on disk. A broken prerender is worse than
 *    none, so `verifyPrerender()` below blocks the build until the files
 *    are on disk and asserts their contents, and fails the build loudly if
 *    they are wrong.
 * ═══════════════════════════════════════════════════════════════════════ */

type RenderedRoute = {
  route: string;
  originalRoute: string;
  html: string;
  outputPath?: string;
};

type PrerenderOptions = {
  staticDir: string;
  outputDir?: string;
  indexPath?: string;
  routes: string[];
  renderer?: unknown;
  postProcess?: (rendered: RenderedRoute) => RenderedRoute;
  server?: Record<string, unknown>;
};

type VitePrerenderModule = ((options: PrerenderOptions) => Plugin) & {
  PuppeteerRenderer: new (options: Record<string, unknown>) => unknown;
};

// Named `nodeRequire`, not `require`: this is a CJS interop escape hatch for one
// broken package entry, not a module system choice for this file.
const nodeRequire = createRequire(import.meta.url);
const vitePrerender = nodeRequire('vite-plugin-prerender') as VitePrerenderModule;

/**
 * The routes the router in `src/App.tsx` actually declares.
 *
 * Derived from `site.pages`, never hardcoded: the other 37 repos run different
 * flags, and a hardcoded list would either miss a live page or prerender a
 * route that 404s. The gating here mirrors `App.tsx` exactly — note that the
 * `/rooms` route is gated on `site.pages.rooms`, not on `accommodation.has`
 * (which is what the nav uses). `*` (NotFound) is deliberately not prerendered.
 */
const prerenderRoutes: string[] = [
  '/',
  '/our-story',
  ...(site.pages.food ? ['/food-drink'] : []),
  ...(site.pages.sundayLunch ? ['/sunday-lunch'] : []),
  ...(site.pages.book ? ['/book'] : []),
  ...(site.pages.rooms ? ['/rooms'] : []),
  ...(site.pages.whatsOn ? ['/whats-on'] : []),
  ...(site.pages.gallery ? ['/gallery'] : []),
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/accessibility',
];

/**
 * Strip the `js` class from the captured `<html>` element.
 *
 * `index.html` sets it inline (`documentElement.classList.add('js')`) and
 * `index.css` reads it as "this page has run JavaScript, so it is allowed to
 * hide content": `.js .reveal { opacity: 0 }` until an IntersectionObserver
 * adds `.in`. Puppeteer bakes that class into the captured markup, so leaving
 * it in place would ship a prerendered page on which every below-the-fold
 * section is `opacity: 0` forever when JS is off — the exact failure the
 * prerender exists to fix, dressed up as a success.
 *
 * The inline script re-adds the class on any real page load with JS enabled,
 * so nothing is lost. This removes a class from a build artefact; it does not
 * remove the behaviour.
 */
function stripJsFlag(html: string): string {
  return html.replace(/<html\b[^>]*>/i, (tag) =>
    tag.replace(/\sclass="([^"]*)"/i, (_attr, value: string) => {
      const kept = value.split(/\s+/).filter((c) => c && c !== 'js');
      return kept.length > 0 ? ` class="${kept.join(' ')}"` : '';
    }),
  );
}

/**
 * Make the capture origin-relative.
 *
 * The prerenderer serves the build over `http://localhost:<random port>`, and Vite's
 * dynamic-import helper injects `<link rel="modulepreload">` for the route chunk at
 * runtime with an origin-qualified href. Puppeteer captures the DOM after that has
 * happened, so without this every prerendered page shipped five dead
 * `http://localhost:8000/assets/*.js` preloads: five refused connections and five
 * console errors on the live site, per page, forever. The paths themselves are correct
 * — only the origin is wrong — so they are made root-relative rather than deleted, and
 * each route keeps a real preload for its own chunk.
 */
function relativiseOrigin(html: string): string {
  return html.replace(/https?:\/\/localhost:\d+/g, '');
}

const EMPTY_ROOT = /<div id="root">\s*<\/div>/;

/** Rough visible-text extraction: assertions must see rendered text, not JSON-LD. */
function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, d: string) => String.fromCharCode(parseInt(d, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function outputFileFor(route: string): string {
  return path.join(distDir, route, 'index.html');
}

/**
 * Make `npm run preview` serve the prerendered files the way the hosts do.
 *
 * `netlify.toml` and `vercel.json` both put static files ahead of the SPA rewrite, so
 * `/our-story` is answered by `dist/our-story/index.html` in production. Vite's preview
 * server does not: it matches no file for an extensionless path and falls straight
 * through to the `/index.html` fallback, so every route previews as the client-rendered
 * shell and the prerender looks like it did nothing. That is a trap for anyone verifying
 * locally, so preview is taught the same static-first rule. Preview only — nothing here
 * runs in a build or ships.
 */
function previewLikeHost(): Plugin {
  return {
    name: 'preview-static-first',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [pathname = '/', query] = (req.url ?? '/').split('?');
        if (pathname !== '/' && !path.extname(pathname)) {
          const candidate = path.join(distDir, pathname, 'index.html');
          if (fs.existsSync(candidate)) {
            req.url = `${pathname.replace(/\/$/, '')}/index.html${query ? `?${query}` : ''}`;
          }
        }
        next();
      });
    },
  };
}

const RENDER_TIMEOUT_MS = 240_000;
const POLL_MS = 250;

/**
 * Blocks `closeBundle` until every route has a real prerendered file on disk,
 * then asserts the file actually carries the things these sites exist to
 * publish: the venue name, the phone number and the opening hours, as HTML
 * text rather than as an empty root.
 *
 * This is the guard against `vite-plugin-prerender`'s swallowed errors. If the
 * prerender never runs, half runs, or renders a blank app, this throws and the
 * build exits non-zero instead of shipping shells.
 */
function verifyPrerender(routes: string[]): Plugin {
  return {
    name: 'verify-prerender',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const deadline = Date.now() + RENDER_TIMEOUT_MS;
      const pending = new Set(routes);

      while (pending.size > 0) {
        for (const route of [...pending]) {
          let html: string;
          try {
            html = await fs.promises.readFile(outputFileFor(route), 'utf8');
          } catch {
            continue;
          }
          if (EMPTY_ROOT.test(html) || !/<\/html>/i.test(html)) continue;
          pending.delete(route);
        }
        if (pending.size === 0) break;
        if (Date.now() > deadline) {
          throw new Error(
            `[verify-prerender] Timed out after ${RENDER_TIMEOUT_MS / 1000}s waiting for ` +
              `prerendered output. Still an empty shell or missing: ${[...pending].join(', ')}.\n` +
              `The build has NOT produced a crawlable site. Check the ` +
              `[vite-plugin-prerender] lines above — it logs failures and then exits 0.`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }

      // Content assertions. Opening hours are asserted per distinct value so a
      // venue with split hours cannot pass on one row.
      const hours = [...new Set(site.openingHours.map((h) => h.hours))];
      const failures: string[] = [];
      const sizes: string[] = [];

      for (const route of routes) {
        const file = outputFileFor(route);
        const html = await fs.promises.readFile(file, 'utf8');
        const text = visibleText(html);
        const label = route === '/' ? '/ (index)' : route;

        if (EMPTY_ROOT.test(html)) failures.push(`${label}: root element is empty`);
        if (!text.includes(site.name)) failures.push(`${label}: venue name "${site.name}" not in rendered text`);
        if (!text.includes(site.phone)) failures.push(`${label}: phone "${site.phone}" not in rendered text`);
        for (const h of hours) {
          if (!text.includes(h)) failures.push(`${label}: opening hours "${h}" not in rendered text`);
        }
        if (!html.includes(site.phoneHref)) failures.push(`${label}: ${site.phoneHref} missing`);
        const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0] ?? '';
        if (/\bclass="[^"]*\bjs\b/.test(htmlTag)) {
          failures.push(`${label}: <html> still carries the "js" class — reveal sections would stay invisible`);
        }
        const leaked = html.match(/https?:\/\/localhost:\d+/g);
        if (leaked) {
          failures.push(`${label}: ${leaked.length} reference(s) to the prerender server origin (${leaked[0]}) left in the markup`);
        }

        sizes.push(
          `  ${label.padEnd(16)} ${(Buffer.byteLength(html) / 1000).toFixed(2).padStart(8)} kB` +
            `   ${String(text.length).padStart(6)} chars of text`,
        );
      }

      if (failures.length > 0) {
        throw new Error(`[verify-prerender] Prerendered output is not usable:\n  ${failures.join('\n  ')}`);
      }

      console.log(`\n[verify-prerender] ${routes.length} routes prerendered and verified:`);
      console.log(sizes.join('\n'));
      console.log('[verify-prerender] venue name, phone number and opening hours present as HTML text on every route.\n');
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePrerender({
      staticDir: distDir,
      routes: prerenderRoutes,
      renderer: new vitePrerender.PuppeteerRenderer({
        headless: true,
        // `--no-sandbox` is added automatically on Linux; the rest keeps the
        // ancient bundled Chromium happy in a container.
        args: ['--disable-dev-shm-usage', '--disable-gpu'],
        // The renderer's own `navigationOptions` default is misspelled upstream
        // (`waituntil`), so puppeteer falls back to waiting for `load` only.
        // `#main` is rendered by Layout, which only mounts once the lazily
        // imported route chunk has resolved, so this is the real "app is on
        // screen" signal rather than a sleep.
        renderAfterElementExists: '#main',
        maxConcurrentRoutes: 4,
      }),
      postProcess(rendered) {
        rendered.html = relativiseOrigin(stripJsFlag(rendered.html));
        return rendered;
      },
    }),
    verifyPrerender(prerenderRoutes),
    previewLikeHost(),
  ],
  build: {
    // es2020 was correct for browsers and wrong for the build. The prerender
    // browser is Chromium 78, pinned transitively by
    // vite-plugin-prerender -> @prerenderer/renderer-puppeteer -> puppeteer@1.20,
    // and Chromium 78 cannot PARSE optional chaining (`?.`) or nullish
    // coalescing (`??`), both of which are ES2020 and both of which appear in
    // React, react-router and this app's own output. At es2020 every prerender
    // died on `SyntaxError: Unexpected token '?'` and captured an empty root.
    // es2019 makes esbuild downlevel exactly those two forms; nothing else
    // about the shipped bundle changes and no polyfill is introduced.
    // Raising this target silently re-breaks the prerender — `verify-prerender`
    // will fail the build if anyone does.
    target: 'es2019',
    // `cssTarget` defaults to `target`, and dropping the CSS to es2019 as well made esbuild
    // lower syntax the design system depends on (+2.9 kB of expanded CSS, and a rewritten
    // cascade the computed-style audit has never seen). The prerender only needs the old
    // browser to PARSE and RUN the JavaScript — CSS it does not understand is ignored and
    // cannot affect the captured markup. So CSS stays exactly where it was.
    cssTarget: 'es2020',
    reportCompressedSize: false,
    // Generate source maps but don't expose them publicly — upload to Sentry instead
    sourcemap: 'hidden',
    // Inline assets smaller than 4KB directly into the bundle (avoids extra requests)
    assetsInlineLimit: 4096,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — cached independently, rarely changes
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // Router — small, rarely changes
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Helmet — small, rarely changes
          if (id.includes('node_modules/react-helmet-async')) {
            return 'vendor-helmet';
          }
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      legalComments: 'none',
    },
  },
});
