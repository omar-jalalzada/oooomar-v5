// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { screenshotPlugin } from './scripts/vite-screenshot-plugin.js';

export default defineConfig({
  site: 'https://omar.build',
  integrations: [react(), sitemap()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  // Dev-only screenshot API (scripts/vite-screenshot-plugin.js); excluded from builds.
  vite: {
    plugins: [screenshotPlugin()],
  },
});
