import {Golgappa} from '@/components/Golgappa'
import {STATE_LABEL, type AreaState} from '@/lib/states'

import styles from './MenuBoard.module.css'

/**
 * The four states, chalked up like the menu board at a stall. Where a stall
 * lists a price, this lists what to do — and under each item, like a dish
 * description, what the word actually means and when it appears.
 */

type Item = {
  state: AreaState
  hindi: string
  /** What the label says about your water, in plain words. */
  means: string
  /** Why this golgappa word: the metaphor, spelled out. */
  like: string
  /** What to do. Chalked where the price would be. */
  todo: string
  /** When an area gets this label. */
  when: string
}

const ITEMS: Item[] = [
  {
    state: 'crisp',
    hindi: 'करारा',
    means: 'Your water is fine. Nobody nearby has reported a problem.',
    like: 'A fresh puri holds its pani without leaking.',
    todo: 'Drink as usual',
    when: 'The normal state — nothing reported in the last few days.',
  },
  {
    state: 'soggy',
    hindi: 'गीला',
    means:
      'Several neighbours have noticed something off — a smell, a colour, people falling ill. Nobody has confirmed it yet.',
    like: 'A puri going soft is not broken yet, but something is wrong.',
    todo: 'Boil 1 minute first',
    when: 'Automatically, once enough signals add up in 3 days. No one has to approve a warning.',
  },
  {
    state: 'phoot',
    hindi: 'फूट गया',
    means: 'A health worker has checked the evidence and confirmed the water is contaminated.',
    like: 'Phoot gaya — the puri has burst and the pani is spilling out.',
    todo: 'Do not drink',
    when: 'Only when a named health worker confirms it. The app can never do this by itself.',
  },
  {
    state: 'fresh',
    hindi: 'ताज़ा',
    means: 'The problem has been fixed and the area is recovering.',
    like: 'A fresh batch has just come out of the kadhai.',
    todo: 'Fixed — stay careful',
    when: 'When the repair is recorded. It goes back to crisp after 5 quiet days.',
  },
]

export function MenuBoard() {
  return (
    <div className={styles.frame}>
      <div className={styles.board}>
        <p className={styles.kicker}>आज का मेन्यू</p>
        <h2 className={styles.title}>Today&rsquo;s water menu</h2>
        <p className={styles.intro}>
          Every neighbourhood carries one of four labels, each named after what happens to a
          golgappa.
        </p>

        <ol className={styles.menu}>
          {ITEMS.map((item) => (
            <li key={item.state} className={`${styles.item} ${styles[item.state]}`}>
              <span className={styles.glyph}>
                <Golgappa state={item.state} size={58} />
              </span>

              <div className={styles.body}>
                <p className={styles.line}>
                  <span className={styles.name}>
                    {STATE_LABEL[item.state]}{' '}
                    <span lang="hi" className={styles.hi}>
                      {item.hindi}
                    </span>
                  </span>
                  <span className={styles.leader} aria-hidden="true" />
                  <span className={styles.todo}>{item.todo}</span>
                </p>

                <p className={styles.means}>{item.means}</p>
                <p className={styles.like}>{item.like}</p>
                <p className={styles.when}>
                  <span className={styles.whenLabel}>Shows up:</span> {item.when}
                </p>
              </div>
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
