> **Date:** 2026-09-29
> **What prompted it:** Omar designed a visual card for each past role in Figma (Kin, Alto,
> Coatue) and wants them on the About page as dynamic, parallax-scrolling covers, built one at a
> time. He chose to place each card as the visual cover above that role's existing narrative.

# Dynamic Role Card System

## Direction

The three designs share a clear system: a wide `1188 × 554` stage, a recessed `1088 × 424` card face, anchored identity/copy at left, and a layered product collage that intentionally escapes the face. Kin is warm and organic; Alto is clinical and illustrative; Coatue is technical and geometric. Preserve those distinct art directions while sharing only the stage and motion mechanics.

Use natural in-page parallax, not sticky scrollytelling. Keep the logo, copy, and card face stable; move only layers that already imply depth. Scroll supplies the primary movement, pointer position adds a quieter desktop-only offset, and reduced-motion users receive the exact static composition.

## Architecture

- Add an optional typed `card` object to the work schema in [`src/content.config.ts`](/Users/omar/omarai/oooomar-v5/src/content.config.ts), containing the card variant and short statement. This removes the current hard-coded role-ID checks.
- Create a shared React foundation under [`src/components/work/`](/Users/omar/omarai/oooomar-v5/src/components/work/):
  - `RoleCardStage.tsx` — aspect ratio, clipping, semantic figure, pointer normalization, scroll progress, reduced motion.
  - `ParallaxLayer.tsx` — named depth settings and compositor-only transforms.
  - `RoleCard.astro` — statically selects and hydrates the requested scene with `client:visible`.
  - `cards/KinCard.tsx`, followed later by `AltoCard.tsx` and `CoatueCard.tsx` — bespoke layer compositions.
- Store exact downloaded Figma assets by role under `src/assets/work/<role>/`; never depend on expiring Figma URLs.
- Add role-card palette and sizing tokens to [`src/styles/tokens.css`](/Users/omar/omarai/oooomar-v5/src/styles/tokens.css). Recreate regular grids in CSS; retain supplied illustrations, screenshots, logos, and decorative SVGs as exact assets.
- Reshape [`src/pages/about.astro`](/Users/omar/omarai/oooomar-v5/src/pages/about.astro) so each sequence is metadata → visual card → Markdown narrative. Let cards break out of the reading measure while narrative text remains narrow.

## Motion model

- Drive each card with `useScroll({ target, offset: ['start end', 'end start'] })` from the existing `motion/react` dependency.
- Group each composition into roughly four depths: background texture, decorative artwork, rear product screens, foreground product screen. Avoid animating every small object independently.
- Use restrained, named amplitudes and springs; identity text remains fixed for legibility.
- On mobile, art-direct a taller composition instead of shrinking the desktop card until its text is unreadable. Disable pointer movement and reduce scroll amplitudes.
- Under `prefers-reduced-motion`, render the settled Figma composition without transforms.

## One-card rollout

1. Archive this accepted plan in `docs/plans/` and index it, per project process.
2. Build Kin statically first, matching the orange grid, logo/copy block, central illustration, and three-screen hierarchy.
3. Verify desktop and mobile screenshots against Figma before adding motion.
4. Add Kin’s depth model: grid fixed, illustration slow, side screens medium, foreground phone strongest.
5. Tune and review Kin in-browser. Treat approval as the gate before building Alto.
6. Reuse the proven shell for Alto, then Coatue, changing only assets, composition, palette, and depth configuration.

## Verification

- Run the Astro build and lint checks.
- Capture the About page through the screenshot endpoint at desktop and mobile widths, including settled and mid-scroll states.
- Check reduced motion, keyboard/semantic reading order, overflow clipping, lazy loading, and that motion remains transform-only.
- Confirm each Figma asset is local, non-empty, correctly cropped, and rendered in its intended layer.
