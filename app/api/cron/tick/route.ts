import {NextResponse} from 'next/server'

import {tick} from '@/sanity/lib/cases'

/**
 * The scheduled tick: quiet cases close, recovered areas go back to crisp.
 *
 * Runs as a Vercel cron (see vercel.json). The same function is what a Sanity
 * scheduled Function will call once Workflows is in place — the timers live in
 * one place either way.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const header = request.headers.get('authorization')
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({error: 'Not allowed.'}, {status: 401})
    }
  }

  try {
    const result = await tick()
    return NextResponse.json({ok: true, ...result})
  } catch (error) {
    console.error('[tick] failed:', error)
    return NextResponse.json({error: 'Tick failed.'}, {status: 500})
  }
}
