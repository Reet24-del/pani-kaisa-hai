'use client'

import {useActionState, useState} from 'react'

import {resolve} from '@/app/control/actions'
import {MIN_REASON} from '@/lib/caseRules'

import styles from './control-ui.module.css'

/**
 * "The fix is done." Turns a red golgappa into a fresh batch. Like confirming,
 * it needs a named verifier and a note residents will read.
 */
export function ResolveAlert({
  alertId,
  areaSlug,
  canDecide,
}: {
  alertId: string
  areaSlug?: string
  canDecide: boolean
}) {
  const [state, action, pending] = useActionState(resolve, {error: null as string | null})
  const [note, setNote] = useState('')
  const ready = canDecide && note.trim().length >= MIN_REASON && !pending

  return (
    <details className={styles.resolve}>
      <summary>Mark fixed</summary>
      <form action={action} className={styles.resolve}>
        <input type="hidden" name="alertId" value={alertId} />
        <input type="hidden" name="areaSlug" value={areaSlug ?? ''} />
        <label htmlFor={`note-${alertId}`} className={styles.reasonLabel}>
          What was fixed — residents read this
        </label>
        <textarea
          id={`note-${alertId}`}
          name="note"
          rows={2}
          className={styles.textarea}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Leaking sewer line near the pump house repaired, chlorine back to 0.4 mg/L."
        />
        {!canDecide ? <p className={styles.hint}>Choose who you are at the top first.</p> : null}
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <button type="submit" className={styles.secondary} disabled={!ready}>
          {pending ? 'Saving…' : 'Fix done, start recovery'}
        </button>
      </form>
    </details>
  )
}
