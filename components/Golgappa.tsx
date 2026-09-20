import styles from './Golgappa.module.css'

export type AreaState = 'crisp' | 'soggy' | 'phoot' | 'fresh'

export const STATE_LABEL: Record<AreaState, string> = {
  crisp: 'Crisp',
  soggy: 'Soggy',
  phoot: 'Phoot gaya',
  fresh: 'Fresh batch',
}

/**
 * The golgappa glyph. Shape carries the meaning, colour only reinforces it, so
 * it still reads for colour-blind users and in bright sunlight (DESIGN.md §5).
 * Always render it next to its label — never alone.
 */
export function Golgappa({state, size = 40}: {state: AreaState; size?: number}) {
  return (
    <svg
      className={`${styles.gg} ${styles[state]}`}
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {state === 'crisp' && (
        <>
          <circle className={styles.body} cx="20" cy="21" r="14" />
          <ellipse className={styles.hole} cx="20" cy="11.5" rx="4.5" ry="2" />
          <path className={styles.shine} d="M11 19c1-4 4-7 8-8" />
        </>
      )}

      {state === 'soggy' && (
        <>
          <path
            className={styles.body}
            d="M6 24c0-6.5 6.3-11 14-11s14 4.5 14 11c0 4.6-6.3 7-14 7S6 28.6 6 24z"
          />
          <ellipse className={styles.hole} cx="20" cy="16" rx="4" ry="1.6" />
          <path className={styles.pani} d="M27 30.5s-2.4 3.1-2.4 4.9a2.4 2.4 0 0 0 4.8 0c0-1.8-2.4-4.9-2.4-4.9z" />
        </>
      )}

      {state === 'phoot' && (
        <>
          <circle className={styles.body} cx="20" cy="22" r="13" />
          <path className={styles.crack} d="M14 11.5l4 6.5-3.5 4 5 4.5-2 6.5" />
          <path className={styles.pani} d="M31 6.5s-2 2.6-2 4a2 2 0 0 0 4 0c0-1.4-2-4-2-4z" />
          <path className={styles.pani} d="M7.5 29s-1.6 2-1.6 3.2a1.6 1.6 0 0 0 3.2 0c0-1.2-1.6-3.2-1.6-3.2z" />
          <circle className={styles.pani} cx="35" cy="19" r="1.4" />
        </>
      )}

      {state === 'fresh' && (
        <>
          <circle className={styles.body} cx="19" cy="22" r="13" />
          <ellipse className={styles.hole} cx="19" cy="13" rx="4" ry="1.7" />
          <path className={styles.spark} d="M33 5v7M29.5 8.5h7M34 19v4M32 21h4" />
        </>
      )}
    </svg>
  )
}
