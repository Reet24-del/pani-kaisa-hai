import {Golgappa} from '@/components/Golgappa'
import {STATE_LABEL, type AreaState} from '@/lib/states'

import styles from './AreaTicker.module.css'

/**
 * The scrolling LED board a stall hangs out front, reading off every area's
 * live state. The list is rendered twice so the loop has no seam; the second
 * copy is hidden from screen readers.
 */
export function AreaTicker({
  areas,
}: {
  areas: {_id: string; name: string; state: AreaState}[]
}) {
  if (areas.length === 0) return null

  const row = (hidden: boolean) => (
    <ul className={styles.row} aria-hidden={hidden || undefined}>
      {areas.map((area) => (
        <li key={`${hidden ? 'b' : 'a'}-${area._id}`} className={`${styles.item} ${styles[area.state]}`}>
          <Golgappa state={area.state} size={20} />
          <span className={styles.name}>{area.name}</span>
          <span className={styles.state}>{STATE_LABEL[area.state]}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={styles.board} role="region" aria-label="Live state of every area">
      <span className={styles.live}>
        <span className={styles.dot} /> LIVE
      </span>
      <div className={styles.track} style={{animationDuration: `${Math.max(24, areas.length * 5)}s`}}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
