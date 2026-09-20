'use client'

import {actAs} from '@/app/control/actions'

import styles from './control-ui.module.css'

/**
 * Who is deciding. In a real deployment this comes from the signed-in account;
 * in the demo it is an explicit choice, because every decision is stored with
 * the name of the person who made it.
 */
export function VerifierPicker({
  verifiers,
  current,
}: {
  verifiers: {_id: string; name: string; role: string}[]
  current: {_id: string; name: string} | null
}) {
  return (
    <form action={actAs} className={styles.picker}>
      <label htmlFor="verifier">Acting as</label>
      <select
        id="verifier"
        name="verifierId"
        defaultValue={current?._id ?? ''}
        className={styles.select}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">Nobody (read only)</option>
        {verifiers.map((v) => (
          <option key={v._id} value={v._id}>
            {v.name} · {v.role}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={styles.small}>
          Set
        </button>
      </noscript>
    </form>
  )
}
