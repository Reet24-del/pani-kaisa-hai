import {Golgappa} from '@/components/Golgappa'
import {STATE_LABEL, STATE_ORDER, type AreaState} from '@/lib/states'

import styles from './MenuBoard.module.css'

/**
 * The four states, chalked up like the menu board at a stall. Where a stall
 * lists prices, this lists what to do.
 */

const WHAT_TO_DO: Record<AreaState, string> = {
  crisp: 'Drink as usual',
  soggy: 'Boil 1 minute first',
  phoot: 'Do not drink',
  fresh: 'Fixed — stay careful',
}

const WHEN: Record<AreaState, string> = {
  crisp: 'nothing reported lately',
  soggy: '3+ signals in 72 hrs · automatic',
  phoot: 'a health worker confirmed it · never automatic',
  fresh: 'repair recorded · crisp again in 5 quiet days',
}

const HINDI: Record<AreaState, string> = {
  crisp: 'करारा',
  soggy: 'गीला',
  phoot: 'फूट गया',
  fresh: 'ताज़ा',
}

export function MenuBoard() {
  return (
    <div className={styles.frame}>
      <div className={styles.board}>
        <p className={styles.kicker}>आज का मेन्यू</p>
        <h2 className={styles.title}>Today&rsquo;s water menu</h2>

        <ol className={styles.menu}>
          {[...STATE_ORDER].reverse().map((state) => (
            <li key={state} className={`${styles.row} ${styles[state]}`}>
              <span className={styles.glyph}>
                <Golgappa state={state} size={54} />
              </span>
              <span className={styles.what}>
                <span className={styles.name}>
                  {STATE_LABEL[state]} <span lang="hi" className={styles.hi}>{HINDI[state]}</span>
                </span>
                <span className={styles.when}>{WHEN[state]}</span>
              </span>
              <span className={styles.leader} aria-hidden="true" />
              <span className={styles.action}>{WHAT_TO_DO[state]}</span>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>
          The shape tells you before the colour does. <span aria-hidden="true">✳</span> Only a
          person can chalk up &ldquo;phoot gaya&rdquo;.
        </p>
      </div>
    </div>
  )
}
