'use client'

import {useActionState} from 'react'

import {signIn} from '@/app/control/actions'

import styles from './control-ui.module.css'

export function SignIn() {
  const [state, action, pending] = useActionState(signIn, {error: null as string | null})

  return (
    <main className={styles.gate}>
      <form action={action} className={styles.gateForm}>
        <h1 className={styles.gateTitle}>Control Room</h1>
        <p className={styles.gateHelp}>
          For health workers and residents’ association volunteers. Judges: the passphrase is in the
          submission post.
        </p>
        <label htmlFor="passphrase">Passphrase</label>
        <input id="passphrase" name="passphrase" type="password" className={styles.input} autoFocus />
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <button type="submit" className={styles.primary} disabled={pending}>
          {pending ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
