import {NextResponse} from 'next/server'

import {tick} from '@/sanity/lib/cases'

/**
 * The scheduled tick: quiet cases close, recovered areas go back to crisp.
 *
 * The Sanity scheduled Function in `functions/daily-tick/` runs the same
 * `runTick` at 00:15 UTC. This Vercel cron (see vercel.json) runs at 00:30 as a
 * backup; a second run changes nothing.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` on cron runs. Without a
  // secret the route is open only in local dev, never on a deployment.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const header = request.headers.get('authorization')
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({error: 'Not allowed.'}, {status: 401})
    }
  } else if (process.env.VERCEL) {
    console.error('[tick] CRON_SECRET is not set; refusing to run.')
    return NextResponse.json({error: 'Not allowed.'}, {status: 401})
  }

  try {
    const result = await tick()
    return NextResponse.json({ok: true, ...result})
  } catch (error) {
    console.error('[tick] failed:', error)
    return NextResponse.json({error: 'Tick failed.'}, {status: 500})
  }
}
