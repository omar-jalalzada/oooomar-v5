// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { screenshotPlugin } from './scripts/vite-screenshot-plugin.js';
import { SOFT_PRESENCE_ENABLED } from './src/lib/soft-presence.ts';

export default defineConfig({
  site: 'https://omar.build',
  integrations: [
    react(),
    sitemap({
      // Soft presence: only the home URL should stay in the sitemap.
      filter: (page) => !SOFT_PRESENCE_ENABLED || page === 'https://omar.build/',
    }),
  ],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  // Dev-only screenshot API (scripts/vite-screenshot-plugin.js); excluded from builds.
  vite: {
    plugins: [screenshotPlugin()],
    optimizeDeps: {
      // `vgpu` is imported by the homepage's client script, so Vite only discovers it once
      // that script runs — then re-optimizes and forces a reload mid-load, which invalidates
      // the URLs the dev toolbar is already fetching and leaves it dead ("504 Outdated
      // Optimize Dep" on its entrypoint, no floating bar). Pre-bundling it at startup means
      // there is nothing left to discover.
      include: ['vgpu'],
    },
  },
});
