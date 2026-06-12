// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // update if a custom domain is connected in Vercel
  site: 'https://omar-neon.vercel.app',
  integrations: [react(), sitemap()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});
