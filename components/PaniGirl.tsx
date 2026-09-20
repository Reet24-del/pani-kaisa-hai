'use client'

import {useEffect, useState} from 'react'

import styles from './PaniGirl.module.css'

/**
 * The girl at the stall: kurti, bangles, a golgappa balanced in one hand and a
 * shot glass of pani tipping into it with the other.
 *
 * She sticks to the side of the page and reacts to whatever section you are
 * reading — each mood is the face that matches the metaphor being explained.
 * Sections opt in with `data-mood="…"`.
 */

export type Mood = 'pour' | 'happy' | 'unsure' | 'alarmed' | 'relieved' | 'serious'

const LINE: Record<Mood, string> = {
  pour: 'One bite. One question.',
  happy: 'Crisp! Nothing to worry about.',
  unsure: 'Hmm… this pani smells off.',
  alarmed: 'Phoot gaya! Don’t drink it.',
  relieved: 'Fixed. Still boiling mine.',
  serious: 'Somebody has to check first.',
}

export function PaniGirl({idPrefix = 'pg', className = ''}: {idPrefix?: string; className?: string}) {
  const [mood, setMood] = useState<Mood>('pour')

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-mood]'))
    if (sections.length === 0) return

    // Whatever crosses the middle band of the screen is what you are reading.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const next = (entry.target as HTMLElement).dataset.mood as Mood | undefined
            if (next) setMood(next)
          }
        }
      },
      {rootMargin: '-45% 0px -45% 0px', threshold: 0},
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const id = (name: string) => `${idPrefix}-${name}`

  return (
    <figure className={`${styles.wrap} ${className}`} data-face={mood}>
      <figcaption className={styles.bubble} key={mood}>
        {LINE[mood]}
      </figcaption>

      <svg viewBox="0 0 320 560" className={styles.svg} role="img" aria-label="A student holding a golgappa while pani is poured into it">
        <defs>
          <linearGradient id={id('kurti')} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#e8734a" />
            <stop offset="100%" stopColor="#c2461f" />
          </linearGradient>
          <radialGradient id={id('puri')} cx="0.35" cy="0.3" r="0.9">
            <stop offset="0%" stopColor="#f8d694" />
            <stop offset="45%" stopColor="var(--puri)" />
            <stop offset="100%" stopColor="var(--puri-edge)" />
          </radialGradient>
          <linearGradient id={id('pani')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pani-light)" />
            <stop offset="100%" stopColor="var(--pani)" />
          </linearGradient>
          <linearGradient id={id('steel')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b9499" />
            <stop offset="35%" stopColor="#eff4f7" />
            <stop offset="70%" stopColor="#aeb8bd" />
            <stop offset="100%" stopColor="#737d7b" />
          </linearGradient>
          <clipPath id={id('holeClip')}>
            <ellipse cx="66" cy="290" rx="21" ry="8" />
          </clipPath>
        </defs>

        {/* ── hair behind ─────────────────────────────────────── */}
        <path
          d="M104 118c0-46 26-78 62-78s62 30 62 76c0 26-4 44-10 60-4 12-16 10-16-2 2-22-2-38-8-48-18 12-56 14-76 2-6 12-8 28-6 46 1 12-11 14-15 3-8-20-13-38-13-59z"
          fill="#2a1a12"
        />
        {/* braid over the shoulder */}
        <path
          d="M116 154c-10 38-12 88-5 130 3 14 13 17 18 4 8-24 8-94 1-134z"
          fill="#33200f"
        />
        <g stroke="#1f1209" strokeWidth="2" opacity="0.5" fill="none">
          <path d="M108 196c8 4 14 4 20 0" />
          <path d="M107 222c8 4 14 4 20 0" />
          <path d="M108 250c8 4 14 4 19 0" />
        </g>
        <path d="M120 290c-6 6-6 14 0 18 6-4 8-12 4-18z" fill="var(--masala)" />

        {/* ── face ────────────────────────────────────────────── */}
        <ellipse cx="166" cy="120" rx="46" ry="52" fill="#dfa477" />
        {/* ears + jhumka earrings */}
        <circle cx="121" cy="124" r="8" fill="#d09a6d" />
        <circle cx="121" cy="140" r="5" fill="var(--saffron)" />
        <circle cx="211" cy="124" r="8" fill="#d09a6d" />
        <circle cx="211" cy="140" r="5" fill="var(--saffron)" />

        {/* fringe */}
        <path
          d="M120 104c2-40 26-64 52-64 30 0 50 24 52 62-14-16-30-26-52-26-20 0-38 10-52 28z"
          fill="#2a1a12"
        />

        <Face id={id} mood={mood} />

        {/* ── neck + kurti ────────────────────────────────────── */}
        <path d="M150 164h32v28c0 8-32 8-32 0z" fill="#cf9468" />
        <path
          d="M166 188c-28 2-48 14-54 34-8 26-12 96-12 150 0 14 6 18 20 18h92c14 0 20-4 20-18 0-54-4-124-12-150-6-20-26-32-54-34z"
          fill={`url(#${id('kurti')})`}
        />
        {/* neckline + print */}
        <path d="M150 190c6 12 26 12 32 0" fill="none" stroke="#8f2f12" strokeWidth="3" />
        <g fill="#ffd9a8" opacity="0.65">
          <circle cx="140" cy="250" r="3" />
          <circle cx="176" cy="268" r="3" />
          <circle cx="208" cy="240" r="3" />
          <circle cx="150" cy="300" r="3" />
          <circle cx="196" cy="320" r="3" />
          <circle cx="128" cy="330" r="3" />
          <circle cx="216" cy="300" r="3" />
          <circle cx="170" cy="350" r="3" />
        </g>
        {/* dupatta slung across, the bit every kurti has */}
        <path
          d="M196 196c14 20 20 60 18 110-1 18-22 16-22-2 0-44-4-80-12-100z"
          fill="#f0b64a"
          opacity="0.9"
        />

        {/* bare shoulders — the kurti is sleeveless */}
        <ellipse cx="116" cy="228" rx="21" ry="24" fill="#e8b083" />
        <ellipse cx="216" cy="228" rx="21" ry="24" fill="#e8b083" />

        {/* Each arm is drawn twice: a slightly larger dark copy underneath and
            the skin copy on top. The outline then wraps the whole limb, so the
            elbow and the wrist have no seam where shapes overlap. */}

        {/* ── her right arm, bringing the glass in ───────────── */}
        <g className={styles.glassArm}>
          <g>
            <path
              d="M206 228C236 246 214 276 156 282"
              stroke="#c78f60"
              strokeWidth="30"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="146" cy="284" rx="22" ry="17" fill="#c78f60" />
          </g>
          <g>
            <path
              d="M206 228C236 246 214 276 156 282"
              stroke="#e8b083"
              strokeWidth="25"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="146" cy="284" rx="19" ry="14" fill="#e8b083" />
          </g>
          {/* fingers curling round the glass */}
          <g stroke="#c78f60" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75">
            <path d="M138 275c-4 4-4 10 0 14" />
            <path d="M146 273c-4 5-4 12 0 17" />
          </g>

          {/* bangles, sitting along the wrist */}
          <g stroke="var(--saffron)" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M178 269c-2 9-2 15 1 21" />
            <path d="M170 271c-2 9-2 15 1 21" />
          </g>
          <path d="M162 273c-2 9-2 15 1 20" stroke="var(--masala)" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* the shot glass, tipped over the puri */}
          <g className={styles.glass}>
            <path
              d="M112 236h32l-4 44a8 8 0 0 1-8 7h-8a8 8 0 0 1-8-7z"
              fill={`url(#${id('steel')})`}
              stroke="#68726f"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M112 236h32l-1 7h-30z" fill="#f4f8fa" />
            <path
              d="M116 248h24l-3 32a7 7 0 0 1-7 6h-4a7 7 0 0 1-7-6z"
              fill={`url(#${id('pani')})`}
              className={styles.glassPani}
            />
          </g>
        </g>

        {/* ── the pouring stream ──────────────────────────────── */}
        <g className={styles.stream}>
          <path
            d="M100 282c-10 5-20 8-28 9"
            stroke={`url(#${id('pani')})`}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="66" cy="292" rx="14" ry="4.5" fill="var(--pani-light)" opacity="0.9" />
        </g>

        {/* ── her left arm, holding the golgappa out ──────────── */}
        <g>
          <path
            d="M118 228C100 250 86 272 82 292"
            stroke="#c78f60"
            strokeWidth="30"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="76" cy="302" rx="25" ry="17" fill="#c78f60" />
        </g>
        <g>
          <path
            d="M118 228C100 250 86 272 82 292"
            stroke="#e8b083"
            strokeWidth="25"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="76" cy="302" rx="22" ry="14" fill="#e8b083" />
        </g>
        {/* fingers cupping the puri */}
        <g stroke="#c78f60" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75">
          <path d="M64 296c-5 3-6 9-3 13" />
          <path d="M76 298c-5 3-6 9-3 13" />
          <path d="M88 297c-5 3-6 9-3 12" />
        </g>

        {/* bangles at that wrist */}
        <g stroke="var(--saffron)" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M84 270c-2 9-2 14 0 20" />
          <path d="M76 274c-2 9-2 14 0 20" />
        </g>
        <path d="M68 279c-2 8-2 13 0 19" stroke="var(--masala)" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        <g transform="translate(9 7) scale(0.86)">
        <g className={styles.puri}>
          <path
            d="M34 300c-2-22 14-38 32-38 18 0 33 15 33 36 0 19-15 30-33 30-17 0-31-11-32-28z"
            fill={`url(#${id('puri')})`}
            stroke="var(--puri-edge)"
            strokeWidth="2.5"
          />
          <circle cx="48" cy="314" r="3.5" fill="var(--puri-edge)" opacity="0.2" />
          <circle cx="78" cy="320" r="2.5" fill="var(--puri-edge)" opacity="0.2" />
          <circle cx="84" cy="296" r="2" fill="var(--puri-edge)" opacity="0.18" />
          <circle cx="60" cy="326" r="2" fill="#fff3d8" opacity="0.5" />
          <circle cx="72" cy="302" r="1.6" fill="#fff3d8" opacity="0.5" />
          <ellipse cx="66" cy="290" rx="21" ry="8" fill="var(--puri-hole)" />
          <g clipPath={`url(#${id('holeClip')})`}>
            <ellipse cx="66" cy="292" rx="20" ry="7" fill={`url(#${id('pani')})`} className={styles.level} />
          </g>
        </g>
        </g>

      </svg>
    </figure>
  )
}

/** Eyes, brows and mouth — the only parts that change between moods. */
function Face({mood, id}: {mood: Mood; id: (name: string) => string}) {
  const brows: Record<Mood, string> = {
    pour: 'M140 100c6-6 16-7 22-3M192 97c-6-6-16-7-22-3',
    happy: 'M140 98c6-7 16-8 22-4M192 94c-6-7-16-8-22-4',
    unsure: 'M140 104c6-9 16-10 22-6M194 90c-7-4-17-3-24 3',
    alarmed: 'M138 92c6-9 18-10 24-5M194 88c-6-9-18-10-24-5',
    relieved: 'M140 100c6-5 16-5 22-2M192 98c-6-5-16-5-22-2',
    serious: 'M139 101c7-3 16-3 23 1M193 100c-7-3-16-3-23 1',
  }

  const mouth: Record<Mood, React.ReactNode> = {
    pour: <path d="M152 148c6 8 20 8 28 0" fill="none" stroke="#8a3c28" strokeWidth="4" strokeLinecap="round" />,
    happy: (
      <path d="M148 144c8 14 28 14 36 0c-6 10-30 10-36 0z" fill="#8a3c28" />
    ),
    unsure: (
      <path d="M150 150c6-4 10 4 16 0c5-3 9 2 14-1" fill="none" stroke="#8a3c28" strokeWidth="4" strokeLinecap="round" />
    ),
    alarmed: <ellipse cx="166" cy="150" rx="12" ry="14" fill="#7c3320" />,
    relieved: <path d="M154 148c6 6 18 6 24 0" fill="none" stroke="#8a3c28" strokeWidth="4" strokeLinecap="round" />,
    serious: <path d="M152 150h28" stroke="#8a3c28" strokeWidth="4" strokeLinecap="round" />,
  }

  const wide = mood === 'alarmed'
  const closed = mood === 'relieved'

  return (
    <g className="face">
      <path d={brows[mood]} stroke="#2a1a12" strokeWidth="5" strokeLinecap="round" fill="none" />

      {closed ? (
        <>
          <path d="M138 122c6-6 16-6 22 0" fill="none" stroke="#2a1a12" strokeWidth="4" strokeLinecap="round" />
          <path d="M172 122c6-6 16-6 22 0" fill="none" stroke="#2a1a12" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="149" cy="122" rx={wide ? 11 : 9} ry={wide ? 12 : 10} fill="#fffaf2" />
          <ellipse cx="183" cy="122" rx={wide ? 11 : 9} ry={wide ? 12 : 10} fill="#fffaf2" />
          <circle cx={mood === 'unsure' ? 152 : 149} cy="123" r={wide ? 6 : 5} fill="#2a1a12" />
          <circle cx={mood === 'unsure' ? 186 : 183} cy="123" r={wide ? 6 : 5} fill="#2a1a12" />
          <circle cx={mood === 'unsure' ? 154 : 151} cy="120" r="2" fill="#fff" />
          <circle cx={mood === 'unsure' ? 188 : 185} cy="120" r="2" fill="#fff" />
        </>
      )}

      {/* bindi */}
      <circle cx="166" cy="92" r="4" fill="var(--masala)" />
      {/* nose + cheeks */}
      <path d="M166 128c-3 6-1 9 3 9" fill="none" stroke="#b97f53" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="136" cy="136" rx="8" ry="5" fill="#e07a5f" opacity={mood === 'alarmed' ? 0.15 : 0.3} />
      <ellipse cx="196" cy="136" rx="8" ry="5" fill="#e07a5f" opacity={mood === 'alarmed' ? 0.15 : 0.3} />
      {mouth[mood]}
      <g id={id('face-end')} />
    </g>
  )
}
