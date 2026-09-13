// Dev-only screenshot API. Lets an agent (or you) capture how a page actually
// renders so UI work can be verified visually instead of guessed at.
//
//   GET /api/screenshot?view=/                 → home (the Constellation canvas)
//   GET /api/screenshot?view=/writing/<slug>/  → a detail page
//   GET /api/screenshot?prototype=<name>       → /prototypes/<name>/ (a Lab)
//
// Query params:
//   view       page path to capture (default "/"). `prototype` is shorthand for /prototypes/<name>/
//   w, h       viewport size (default 1440x900)
//   full       "1" → full-page (scrolling) screenshot
//   animate    "1" → let the canvas entrance animation play (default skips it for a settled shot)
//   wait       extra settle time in ms (default 700, or 4200 when animate=1)
//
// Returns image/png. Drives the system Google Chrome via playwright-core, so it
// adds no browser download and only runs under `astro dev` (apply: 'serve').
import { chromium } from 'playwright-core';

export function screenshotPlugin() {
  return {
    name: 'screenshot-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/screenshot')) return next();

        const host = req.headers.host || `localhost:${server.config.server.port ?? 4321}`;
        const url = new URL(req.url, `http://${host}`);
        const q = url.searchParams;

        const proto = q.get('prototype');
        let view = q.get('view') || (proto ? `/prototypes/${proto}/` : '/');
        if (!view.startsWith('/')) view = `/${view}`;
        const target = `http://${host}${view}`;

        const w = Number(q.get('w')) || 1440;
        const h = Number(q.get('h')) || 900;
        const full = q.get('full') === '1';
        const animate = q.get('animate') === '1';
        const wait = Number(q.get('wait'));
        const settle = Number.isFinite(wait) ? wait : animate ? 4200 : 700;

        let browser;
        try {
          browser = await chromium.launch({
            channel: 'chrome',
            // Headless Chrome hides navigator.gpu by default, which makes
            // WebGPU prototypes capture as their no-support fallback.
            args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
          });
          const ctx = await browser.newContext({
            viewport: { width: w, height: h },
            deviceScaleFactor: 2,
          });
          // Skip the one-time entrance animation so the canvas is captured settled.
          if (!animate) {
            await ctx.addInitScript(() => {
              try {
                sessionStorage.setItem('cnst-entered', '1');
              } catch {}
            });
          }
          const page = await ctx.newPage();
          await page.goto(target, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(settle);
          const buf = await page.screenshot({ fullPage: full, type: 'png' });
          await browser.close();

          res.statusCode = 200;
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'no-store');
          res.end(buf);
        } catch (err) {
          if (browser) await browser.close().catch(() => {});
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: String((err && err.stack) || err), target }));
        }
      });
    },
  };
}

export default screenshotPlugin;
