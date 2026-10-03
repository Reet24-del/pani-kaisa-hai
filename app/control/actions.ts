'use server'

import {revalidatePath} from 'next/cache'
import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'

import {decideCase, resolveAlert} from '@/sanity/lib/cases'

/**
 * Control room actions.
 *
 * This web control room is the version judges (and anyone without a Sanity
 * login) can actually use. Every action here goes through `decideCase` or
 * `resolveAlert`, which check the verifier, the reason and the case status on
 * the server, so the human-only rule holds whatever the browser sends.
 *
 * Server actions are public endpoints, so each one checks the passphrase
 * cookie itself instead of trusting that the page was rendered signed in.
 */

const PASS_COOKIE = 'pkh_control'
const VERIFIER_COOKIE = 'pkh_verifier'

function passphrase() {
  return process.env.CONTROL_ROOM_PASSPHRASE || 'pani-demo'
}

async function signedIn(): Promise<boolean> {
  const jar = await cookies()
  return jar.get(PASS_COOKIE)?.value === passphrase()
}

type FormState = {error: string | null}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const given = String(formData.get('passphrase') ?? '').trim()

  if (given !== passphrase()) {
    return {error: 'That passphrase is not right.'}
  }

  const jar = await cookies()
  jar.set(PASS_COOKIE, passphrase(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  revalidatePath('/control')
  return {error: null}
}

export async function actAs(formData: FormData) {
  if (!(await signedIn())) return
  const verifierId = String(formData.get('verifierId') ?? '')
  const jar = await cookies()
  jar.set(VERIFIER_COOKIE, verifierId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  revalidatePath('/control')
}

export async function signOut() {
  const jar = await cookies()
  jar.delete(PASS_COOKIE)
  jar.delete(VERIFIER_COOKIE)
  redirect('/control')
}

const DONE: Record<string, string> = {
  confirm: 'confirmed',
  dismiss: 'dismissed',
  requestTest: 'test',
}

export async function decide(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await signedIn())) return {error: 'Your session ended. Sign in again.'}
  const jar = await cookies()
  const verifierId = jar.get(VERIFIER_COOKIE)?.value
  if (!verifierId) return {error: 'Pick who you are first.'}

  const caseId = String(formData.get('caseId') ?? '')
  const decision = String(formData.get('decision') ?? '') as 'confirm' | 'dismiss' | 'requestTest'
  const reason = String(formData.get('reason') ?? '')
  const areaSlug = String(formData.get('areaSlug') ?? '')

  let result: Awaited<ReturnType<typeof decideCase>>
  try {
    result = await decideCase({caseId, decision, reason, verifierId})
  } catch (error) {
    console.error('[control] decide failed:', error)
    return {error: 'Someone may have just decided this case, or Sanity did not answer. Refresh and try again.'}
  }
  if (!result.ok) return {error: result.error}

  revalidatePath('/control')
  revalidatePath('/')
  if (areaSlug) revalidatePath(`/area/${areaSlug}`)
  // The card disappears from the queue once decided, so say what happened at the top.
  redirect(`/control?done=${DONE[decision] ?? 'decided'}${areaSlug ? `&area=${encodeURIComponent(areaSlug)}` : ''}`)
}

export async function resolve(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await signedIn())) return {error: 'Your session ended. Sign in again.'}
  const jar = await cookies()
  const verifierId = jar.get(VERIFIER_COOKIE)?.value
  if (!verifierId) return {error: 'Pick who you are first.'}

  const areaSlug = String(formData.get('areaSlug') ?? '')

  let result: Awaited<ReturnType<typeof resolveAlert>>
  try {
    result = await resolveAlert({
      alertId: String(formData.get('alertId') ?? ''),
      note: String(formData.get('note') ?? ''),
      verifierId,
    })
  } catch (error) {
    console.error('[control] resolve failed:', error)
    return {error: 'Could not mark it fixed just now. Refresh and try again.'}
  }
  if (!result.ok) return {error: result.error}

  revalidatePath('/control')
  revalidatePath('/')
  if (areaSlug) revalidatePath(`/area/${areaSlug}`)
  redirect(`/control?done=fixed${areaSlug ? `&area=${encodeURIComponent(areaSlug)}` : ''}`)
}
