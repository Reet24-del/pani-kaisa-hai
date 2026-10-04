import {createClient} from '@sanity/client'
import {scheduledEventHandler} from '@sanity/functions'

import {runTick} from '../../lib/dailyTick'

/**
 * The daily tick as a Sanity scheduled Function: quiet cases close, recovered
 * areas go back to crisp, and every golgappa is re-derived. Same `runTick` the
 * Vercel cron route calls, here with the blueprint's robot token.
 *
 * The Stack is organization scoped (scheduled functions require it), so the
 * project and dataset are named here rather than taken from the context.
 */
export const handler = scheduledEventHandler(async ({context}) => {
  const client = createClient({
    ...context.clientOptions,
    projectId: 'ya4g5th1',
    dataset: 'production',
    apiVersion: '2026-09-20',
    useCdn: false,
  })

  const result = await runTick(client)
  console.log(`daily tick: closed ${result.closed} quiet case(s), ${result.recovered} area(s) back to crisp`)
})
