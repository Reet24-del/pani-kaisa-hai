/**
 * One place that knows whether Sanity is configured yet.
 *
 * Before `sanity init` has run there are no env vars, and every page should
 * still render (with setup instructions) instead of crashing — that is what
 * let the whole UI be built before the dataset existed.
 */

export const sanityConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)

export async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  if (!sanityConfigured) return null
  const {sanityFetch} = await import('./live')
  const {data} = await sanityFetch({query, params})
  return data as T
}
