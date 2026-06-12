// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://omar.build',
  integrations: [react(), sitemap()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});
