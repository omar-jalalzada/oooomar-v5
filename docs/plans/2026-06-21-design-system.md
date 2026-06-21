# Design System + React Component Library

**Date:** 2026-06-21
**Prompted by:** Omar's request to formalize a design system (color, type, spacing, layout, shadows/elevation), build a React component library optimized for motion, and add a visible design system reference page.

---

## Context

The site has a solid token foundation in `src/styles/tokens.css` (spacing, colors, type scale) but is missing shadow/elevation tokens, easing/duration tokens, and a z-index scale. All animation is currently pure CSS + vanilla JS. The user wants to add a motion-optimized React component library and a design system page that makes all declarations visible and testable.

---

## Motion Library Decision

**Install `motion`** (formerly Framer Motion, v12+, import from `motion/react`).
- React 19 compatible
- Web Animations API under the hood — GPU-composited, 60fps
- Spring physics built-in (`type: 'spring'`, `useSpring`, `useMotionValue`)
- Tree-shakeable; Astro islands mean the bundle only loads when the component hydrates
- `AnimatePresence` handles card filter transitions cleanly

```
npm install motion
```

---

## Step 1: Expand `src/styles/tokens.css`

Add to the bottom of `:root {}`:

### Shadows — layered, accent-tinted (blue `#195cff`)

```css
--shadow-sm:
  0 1px 2px rgba(25, 35, 90, 0.06),
  0 4px 12px -4px rgba(25, 92, 255, 0.10);
--shadow-md:
  0 2px 6px rgba(40, 40, 90, 0.08),
  0 16px 40px -12px rgba(25, 92, 255, 0.18);
--shadow-lg:
  0 4px 12px rgba(40, 40, 90, 0.10),
  0 40px 80px -24px rgba(25, 92, 255, 0.28);
--shadow-float:
  0 2px 8px rgba(25, 35, 90, 0.08),
  0 24px 60px -24px rgba(20, 40, 120, 0.40);
```

### Easing — formalize the curves already in the codebase

```css
--ease-pop:      cubic-bezier(0.34, 1.28, 0.4,  1);   /* overshoot — signature */
--ease-out:      cubic-bezier(0.2,  0.75, 0.2,  1);   /* reveal/panel slides */
--ease-in-out:   cubic-bezier(0.62, 0.04, 0.22, 1);   /* flips, modals */
--ease-standard: cubic-bezier(0.4,  0,    0.2,  1);   /* general purpose */
```

### Durations

```css
--duration-instant:  80ms;
--duration-fast:    160ms;
--duration-normal:  320ms;
--duration-slow:    500ms;
--duration-entrance: 800ms;
```

### Z-index scale

```css
--z-base:    0;
--z-raised:  10;
--z-overlay: 40;
--z-nav:     80;
--z-modal:  100;
--z-toast:  120;
```

---

## Step 2: React Component Library — `src/components/ui/`

Create these files. Use CSS modules (`.module.css` beside each `.tsx`) — tokens only, no raw hex.

### `Card.tsx`

```typescript
interface CardProps {
  href: string;
  title: string;
  description: string;
  meta?: string;
  draft?: boolean;
  index?: number; // for stagger delay
}
```

- `motion.article` with `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}`
- Transition: `{ duration: 0.32, delay: index * 0.06, ease: [0.2, 0.75, 0.2, 1] }`
- Hover: `whileHover={{ y: -3 }}` with `{ type: 'spring', stiffness: 320, damping: 22 }`
- CSS handles shadow transition: `--shadow-sm` → `--shadow-md` on hover
- Respect `useReducedMotion()` — zero duration when reduced motion preferred
- Full-card link via `::after` pseudo-element (same pattern as `Card.astro`)

### `CardGrid.module.css` (shared)

Shared CSS module for grid layout, imported by `LabsGrid.tsx` and `FilterBar.tsx`.

### `LabsGrid.tsx`

Accepts `cards` array, renders with stagger entrance. Mounted with `client:visible` on labs page.

### `FilterBar.tsx`

```typescript
interface FilterBarProps {
  topics: { value: string; label: string }[];
  cards: CardData[];
  initialTopic?: string;
}
```

- `useState` for active topic — replaces the `<script>` block on writing index
- `AnimatePresence mode="popLayout"` on card list: exiting cards fade/slide down, entering cards bounce in
- Renders filter buttons + card grid internally
- Mounted with `client:load` on writing page

**What NOT to migrate to React:** nav, header, footer, lab detail pages, about page, Constellation. Keep `Card.astro` alive.

---

## Step 3: Update Pages

### `src/pages/writing/index.astro`

- Remove filter buttons, CardGrid, script block
- Add `<FilterBar client:load {topics} {cards} initialTopic={initialTopic} />`

### `src/pages/labs/index.astro`

- Replace card loop with `<LabsGrid client:visible {cards} />`

---

## Step 4: Design System Page

**Route:** `src/pages/design-system.astro` — dev only, redirects to `/` in production.

Add conditional nav link in `Base.astro` (dev only).

### Sections
1. Colors — swatch grid
2. Typography — font specimens + type scale
3. Spacing — visual ruler bars
4. Elevation — 4 shadow cards
5. Motion — `EasingDemo` React island
6. Components — live `FilterBar` + cards with mock data
7. Radii & Borders

---

## Critical Files

- `src/styles/tokens.css` — expand
- `src/components/ui/Card.tsx` + `Card.module.css` — new
- `src/components/ui/CardGrid.module.css` — new (shared grid)
- `src/components/ui/LabsGrid.tsx` — new
- `src/components/ui/FilterBar.tsx` + `FilterBar.module.css` — new
- `src/components/ui/EasingDemo.tsx` + `EasingDemo.module.css` — new
- `src/pages/design-system.astro` — new
- `src/layouts/Base.astro` — conditional DS nav link
- `src/pages/writing/index.astro` — FilterBar island
- `src/pages/labs/index.astro` — LabsGrid island
