import 'server-only'

/**
 * The alert e-mail to the municipal contact: everything a crew needs to go and
 * look, so nobody has to re-investigate from scratch.
 *
 * Without RESEND_API_KEY it logs instead of sending — a demo should never
 * silently mail a real water department.
 */
export async function sendAlertEmail(input: {
  to?: string
  areaName: string
  breakdown: string
  verifierName: string
  reason: string
}): Promise<boolean> {
  const {to, areaName, breakdown, verifierName, reason} = input

  const subject = `Water alert: ${areaName} — confirmed by ${verifierName}`
  const body = [
    `Contamination has been confirmed in ${areaName}.`,
    '',
    `Confirmed by: ${verifierName}`,
    `Reason given: ${reason}`,
    `Evidence: ${breakdown}`,
    '',
    'Residents in this area have been told not to drink tap water.',
    '',
    'Sent by Pani Kaisa Hai?, a resident early-warning tool. This is not a laboratory result.',
  ].join('\n')

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ALERT_FROM_EMAIL

  if (!apiKey || !from || !to) {
    console.info(`[email] not sent (no key, sender or recipient)\nTo: ${to ?? '—'}\n${subject}\n${body}`)
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({from, to, subject, text: body}),
    })
    if (!response.ok) {
      console.error('[email] send failed:', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('[email] send failed:', error)
    return false
  }
}
