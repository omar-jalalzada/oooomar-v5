/**
 * Soft presence: production shows only the OMAR mark + tagline until there's
 * something ready to ship. Local `npm run dev` always shows the full site
 * (drafts included via getVisible), so you can keep iterating.
 *
 * When ready to reopen omar.build: set this to `false` and flip the pieces you
 * want live back to `status: published`.
 */
export const SOFT_PRESENCE_ENABLED = true;

/** True only on production builds while soft presence is enabled. */
export const SOFT_PRESENCE = SOFT_PRESENCE_ENABLED && import.meta.env.PROD;
