# Ideas parking lot

Deferred "while I'm at it" ideas live here instead of derailing builds.
When one graduates, it becomes a plan in `docs/plans/`.

- Brand / visual identity — uniquely and unmistakably Omar; replaces the wireframe tokens
- Cinematic home entrance — grid that loads with varied content, categories sort cards
- Notion MCP pipeline — capture in Notion → draft → commit markdown
- Full case studies for Sublime, Kin, Alto, Coatue (Context → Role → Constraints → Process → Decisions → Outcomes → Learnings)
- Labs collaborations / co-creations ("remixes", "b2b sets")
- SEO keyword work — "design in cybersecurity", "design leadership"
- Cross-posting workflow to Substack / Medium (RSS feed already exists)
- Custom domain (then update `site` in astro.config.mjs)
- GitHub Issues loop for post-launch enhancements (Patrick Morgan's workflow)
- OG image generation for posts
- `og:image` for the homepage — `Base.astro` sets none, and the home is now the bar field, i.e. a
  page that *is* a visual. Sharing it currently previews as plain text. The dev screenshot plugin
  can already capture the settled field, so this is mostly plumbing: capture once, commit the PNG,
  add the tag. Deferred out of the bar-field homepage plan rather than forgotten.
- Bar field on a portrait tablet — the homepage decides between the word and the stacked letters on
  viewport *width* (`STACK_MAX_WIDTH` = 640 in `field.ts`), so 768×1024 keeps the word: the mark
  sits small in a tall empty page with a ~7.5px tagline. Pre-existing v6 behaviour, not caused by
  the stack, and it needs a real decision rather than a threshold nudge — trigger on aspect ratio,
  or let the mark's scale respond to height as well as width. Parked out of the stacked-letters
  pass.
- Dev server 404s on prototype directory URLs — `/prototypes/<slug>/` and `/prototypes/<slug>/vN/`
  both 404 under `astro dev` (farsh, girih, all of them), so the iframe on every experiment detail
  page shows Astro's 404 while `…/index.html` loads fine. Production is unaffected. Wants a small
  dev-only rewrite of `/dir/` → `/dir/index.html` alongside the screenshot plugin.
- Web Analytics 404s on omar.build — the Vercel adapter is configured with
  `webAnalytics: { enabled: true }`, so every page requests `/_vercel/insights/script.js` and gets
  a 404 back: the flag turns on the *script tag*, but Analytics still has to be enabled on the
  Vercel project itself. Nothing depends on the script, so the only cost is that no traffic is
  being recorded — which matters more now the homepage is the thing worth measuring. Fixed with a
  dashboard toggle rather than a code change, or by dropping the flag if the numbers aren't wanted.
  Pre-existing; spotted while verifying the bar-field deploy.
- About page: "What shaped me" (books, people, moments) and "On the road" (places that stuck) —
  both existed as cards in the old `about` collection with only a one-line placeholder, so they
  weren't carried into the single About page as empty sections. Add them once there's real
  content.
