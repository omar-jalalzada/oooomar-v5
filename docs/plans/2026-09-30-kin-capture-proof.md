# Kin capture proof

**Date:** 2026-09-30  
**Prompt:** Test whether the shipped Kin code and assets can produce case-study screenshots without access to the original Figma file.

## Build the renderer
- Add a small Vite/React capture app under [`tools/kin-capture/`](/Users/omar/omarai/oooomar-v5/tools/kin-capture/) with fixture data and route-controlled screen states.
- Reconstruct `TasksHomeScreen`, `AccountabilityBuddyScreen`, and `StoryViewScreen` from the corresponding source in [`LivingWellApp/features/`](/Users/omar/omarai/kin%20habits/LivingWellApp/features/), copying only the Kin assets needed for a portable renderer.
- Preserve the original typography, palette, spacing, icons, status bar, and device-safe-area behavior. Keep capture-only code isolated from the portfolio site.

## Capture representative states
- Render four initial frames: Tasks default, Tasks completed/end-of-day, buddies matched, and Story view.
- Add a Playwright capture script using an iPhone 11-sized viewport at high pixel density, producing deterministic PNGs under `tools/kin-capture/output/`.

## Verify fidelity
- Compare each output against source styling and asset usage, fix obvious visual drift, and inspect the generated PNGs directly.
- Run the portfolio build to ensure the isolated tool does not affect the shipped site, then share the renders for a go/no-go decision before expanding to the full screen list.
