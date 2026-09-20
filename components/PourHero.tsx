import styles from './PourHero.module.css'

/**
 * The hero: a steel tumbler tips directly over the golgappa, imli pani drops
 * straight into the torn hole on top, the puri fills, and the question lands —
 * is this pani clean?
 *
 * Pure SVG + CSS keyframes: no library, no JavaScript, fine on a cheap phone,
 * and under `prefers-reduced-motion` it holds the filled frame instead of
 * vanishing.
 */

/** Fried blisters. A real puri is lumpy and unevenly browned, never a smooth ball. */
const BLISTERS: [number, number, number, number][] = [
  // x, y, radius, opacity
  [150, 276, 7, 0.16],
  [176, 312, 5, 0.14],
  [214, 322, 6.5, 0.13],
  [252, 306, 4.5, 0.15],
  [272, 268, 7.5, 0.17],
  [268, 226, 5, 0.12],
  [176, 238, 4, 0.1],
  [146, 244, 5.5, 0.12],
  [238, 262, 3.5, 0.1],
  [200, 288, 4, 0.09],
  [228, 292, 3, 0.1],
  [160, 296, 3.5, 0.11],
  [286, 250, 4, 0.12],
  [132, 266, 4.5, 0.13],
]

/** Semolina speckle — what makes it read as fried rather than baked. */
const SUJI: [number, number, number][] = [
  [168, 258, 1.6],
  [190, 300, 1.4],
  [228, 312, 1.5],
  [258, 284, 1.3],
  [280, 236, 1.5],
  [150, 232, 1.3],
  [206, 246, 1.4],
  [244, 236, 1.2],
  [134, 288, 1.4],
  [296, 274, 1.3],
  [214, 268, 1.2],
  [178, 276, 1.3],
]

export function PourHero() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <svg viewBox="0 0 440 420" className={styles.svg} role="presentation">
        <defs>
          <radialGradient id="puriSkin" cx="0.34" cy="0.26" r="0.92">
            <stop offset="0%" stopColor="#f8d694" />
            <stop offset="38%" stopColor="var(--puri)" />
            <stop offset="78%" stopColor="var(--puri-deep)" />
            <stop offset="100%" stopColor="var(--puri-edge)" />
          </radialGradient>

          <linearGradient id="paniBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pani-light)" />
            <stop offset="100%" stopColor="var(--pani)" />
          </linearGradient>

          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b9499" />
            <stop offset="28%" stopColor="#eff4f7" />
            <stop offset="56%" stopColor="#b2bcc1" />
            <stop offset="100%" stopColor="#737d7b" />
          </linearGradient>

          <radialGradient id="lamp" cx="0.5" cy="0.45" r="0.5">
            <stop offset="0%" stopColor="var(--saffron)" stopOpacity="0.4" />
            <stop offset="70%" stopColor="var(--saffron)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--saffron)" stopOpacity="0" />
          </radialGradient>

          {/* The torn opening on top: the pani inside is clipped to it. */}
          <clipPath id="holeClip">
            <path d="M172 196c2-13 18-22 40-22s38 8 40 21c1 11-17 19-40 19s-42-8-40-18z" />
          </clipPath>
        </defs>

        <ellipse cx="214" cy="258" rx="200" ry="148" fill="url(#lamp)" className={styles.glow} />

        <g stroke="var(--muted)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.45">
          <path d="M104 250c-9-13 7-20-2-33" className={styles.steam1} />
          <path d="M338 268c-9-13 7-20-2-33" className={styles.steam2} />
        </g>

        {/* ── the tumbler, tipping straight over the hole ─────── */}
        <g className={styles.glass}>
          <path
            d="M168 14h92l-12 104a16 16 0 0 1-16 14h-36a16 16 0 0 1-16-14z"
            fill="url(#steel)"
            stroke="#68726f"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M168 14h92l-2 13h-88z" fill="#f4f8fa" />
          <path
            d="M175 40h78l-9 76a14 14 0 0 1-14 12h-32a14 14 0 0 1-14-12z"
            fill="url(#paniBody)"
            className={styles.glassPani}
          />
          <path d="M186 44v78" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* ── the golgappa ────────────────────────────────────── */}
        <g className={styles.puri}>
          {/* leaf bowl + shadow */}
          <ellipse cx="212" cy="374" rx="112" ry="18" fill="var(--puri-edge)" opacity="0.2" />
          <path
            d="M98 362c0-12 51-19 114-19s114 7 114 19-51 24-114 24-114-12-114-24z"
            fill="var(--surface-alt)"
            stroke="var(--rule-strong)"
            strokeWidth="2.5"
          />

          {/* the puffed, uneven body */}
          <path
            d="M118 284c-4-54 34-96 92-98 54-2 102 34 106 88 4 48-38 84-98 85-56 1-96-31-100-75z"
            fill="url(#puriSkin)"
            stroke="var(--puri-edge)"
            strokeWidth="3"
          />

          {/* fried blisters and semolina speckle */}
          {BLISTERS.map(([x, y, r, o], i) => (
            <circle key={`b${i}`} cx={x} cy={y} r={r} fill="var(--puri-edge)" opacity={o} />
          ))}
          {SUJI.map(([x, y, r], i) => (
            <circle key={`s${i}`} cx={x} cy={y} r={r} fill="#fff3d8" opacity="0.45" />
          ))}

          {/* the crisp highlight where the oil caught it */}
          <path
            d="M146 276c2-34 20-58 48-70"
            stroke="#fff4de"
            strokeOpacity="0.45"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />

          {/* the torn hole, with pani rising inside it */}
          <path
            d="M172 196c2-13 18-22 40-22s38 8 40 21c1 11-17 19-40 19s-42-8-40-18z"
            fill="var(--puri-hole)"
          />
          <g clipPath="url(#holeClip)">
            <ellipse cx="212" cy="200" rx="42" ry="14" fill="url(#paniBody)" className={styles.level} />
            <ellipse cx="212" cy="196" rx="26" ry="5" fill="var(--pani-light)" className={styles.ripple} />
          </g>
          {/* chipped crust around the rim, so the opening looks broken, not cut */}
          <path
            d="M172 196c2-13 18-22 40-22s38 8 40 21"
            fill="none"
            stroke="var(--puri-deep)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M186 180l7 6-9 5z" fill="var(--puri)" />
          <path d="M232 176l8 5-9 6z" fill="var(--puri)" />
          <path d="M209 172l6 6-8 4z" fill="var(--puri)" />
        </g>

        {/* ── the pani falling straight in ────────────────────── */}
        <g className={styles.stream}>
          <path
            d="M214 118c-2 26-3 46-2 68"
            stroke="url(#paniBody)"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
            className={styles.streamFlow}
          />
          <path
            d="M215 122c-2 24-3 42-2 62"
            stroke="var(--pani-light)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
            className={styles.streamHighlight}
          />
          <ellipse cx="212" cy="192" rx="20" ry="6" fill="var(--pani-light)" opacity="0.95" />
        </g>

        {/* splash at the moment of impact */}
        <g fill="var(--pani-light)" className={styles.splash}>
          <circle cx="186" cy="188" r="4.5" className={styles.drop1} />
          <circle cx="238" cy="186" r="3.6" className={styles.drop2} />
          <circle cx="212" cy="178" r="3" className={styles.drop3} />
        </g>
      </svg>
    </div>
  )
}
