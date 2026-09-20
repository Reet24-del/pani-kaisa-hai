import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'

/** Read-only client for the public site. Safe in the browser. */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})

/**
 * Write client for server code only (the report route, Functions).
 * The token never reaches the browser — importing this from a client component
 * is a bug.
 */
export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) {
    throw new Error('Missing SANITY_API_WRITE_TOKEN — needed to accept reports.')
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  })
}
