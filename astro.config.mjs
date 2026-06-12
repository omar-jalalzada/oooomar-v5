// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // TODO: replace with the real domain once it's connected in Vercel
  site: 'https://omarjalalzada.vercel.app',
  integrations: [react(), sitemap()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});
