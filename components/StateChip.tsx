import {STATE_LABEL, type AreaState} from '@/lib/states'

import {Golgappa} from './Golgappa'
import styles from './StateChip.module.css'

/**
 * Glyph + label, never one without the other (DESIGN.md §5).
 */
export function StateChip({
  state,
  reason,
  size = 28,
}: {
  state: AreaState
  reason?: string
  size?: number
}) {
  return (
    <span className={`${styles.chip} ${styles[state]}`}>
      <Golgappa state={state} size={size} />
      <span className={styles.text}>
        <strong>{STATE_LABEL[state]}</strong>
        {reason ? <span className={styles.reason}>{reason}</span> : null}
      </span>
    </span>
  )
}
