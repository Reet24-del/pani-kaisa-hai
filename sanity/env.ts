/**
 * Sanity environment.
 *
 * These deliberately do not throw when unset. The app has to build and boot
 * before a Sanity project exists — the home page then renders the setup steps
 * instead of a stack trace, and `sanityConfigured` in ./lib/fetch.ts is the one
 * check that decides whether any query runs.
 */

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-20'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

/** A placeholder keeps `createClient` happy at import time; no query is made with it. */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not-configured'

export const isConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
