import {defineLive} from 'next-sanity/live'

import {client} from './client'

/**
 * Live Content API: a confirmed alert has to reach an open map in seconds, not
 * on the next revalidate. `SanityLive` is mounted in app/layout.tsx.
 *
 * The read token is optional — without it, published content still streams.
 */
export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
})
