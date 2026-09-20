'use server'

import {revalidatePath} from 'next/cache'
import {cookies} from 'next/headers'

import {decideCase, resolveAlert} from '@/sanity/lib/cases'

/**
 * Control room actions.
 *
 * This web control room is the version judges (and anyone without a Sanity
 * login) can actually use; the App SDK app in control-room/ is the same queue
 * inside the Sanity Dashboard. Both call the same `decideCase`, so the
 * human-only rule cannot be bypassed by picking a different surface.
 */

const PASS_COOKIE = 'pkh_control'
const VERIFIER_COOKIE = 'pkh_verifier'

export async function signIn(_prev: {error: string | null}, formData: FormData) {
  const given = String(formData.get('passphrase') ?? '')
  const expected = process.env.CONTROL_ROOM_PASSPHRASE || 'pani-demo'

  if (given !== expected) {
    return {error: 'That passphrase is not right.'}
  }

  const jar = await cookies()
  jar.set(PASS_COOKIE, expected, {httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12})
  revalidatePath('/control')
  return {error: null}
}

export async function actAs(formData: FormData) {
  const verifierId = String(formData.get('verifierId') ?? '')
  const jar = await cookies()
  jar.set(VERIFIER_COOKIE, verifierId, {httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12})
  revalidatePath('/control')
}

export async function decide(_prev: {error: string | null}, formData: FormData) {
  const jar = await cookies()
  const verifierId = jar.get(VERIFIER_COOKIE)?.value
  if (!verifierId) return {error: 'Pick who you are first.'}

  const caseId = String(formData.get('caseId') ?? '')
  const decision = String(formData.get('decision') ?? '') as 'confirm' | 'dismiss' | 'requestTest'
  const reason = String(formData.get('reason') ?? '')

  const result = await decideCase({caseId, decision, reason, verifierId})
  revalidatePath('/control')
  revalidatePath('/')
  return result.ok ? {error: null} : {error: result.error}
}

export async function resolve(_prev: {error: string | null}, formData: FormData) {
  const jar = await cookies()
  const verifierId = jar.get(VERIFIER_COOKIE)?.value
  if (!verifierId) return {error: 'Pick who you are first.'}

  const result = await resolveAlert({
    alertId: String(formData.get('alertId') ?? ''),
    note: String(formData.get('note') ?? ''),
    verifierId,
  })
  revalidatePath('/control')
  revalidatePath('/')
  return result.ok ? {error: null} : {error: result.error}
}
