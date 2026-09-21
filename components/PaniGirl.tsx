'use client'

import {useEffect, useState} from 'react'

import styles from './PaniGirl.module.css'

/**
 * The girl at the stall: a college student in a sleeveless kurti and bangles,
 * with a golgappa and a shot glass of pani.
 *
 * She sticks to the side of the page and reacts to whatever section you are
 * reading — each mood is the pose and face that matches the metaphor being
 * explained. Sections opt in with `data-mood="…"`.
 *
 * The four illustrations were generated from one reference image so she stays
 * the same person across moods (prompts are in BUILD_LOG.md). All four are
 * stacked and crossfaded, so a mood change never waits on a download.
 */

export type Mood = 'pour' | 'happy' | 'unsure' | 'alarmed' | 'relieved' | 'serious'

type Pose = 'pour' | 'happy' | 'unsure' | 'alarmed'

const POSES: Pose[] = ['pour', 'happy', 'unsure', 'alarmed']

/** Which illustration each mood uses. Two moods share a pose on purpose. */
const POSE_FOR: Record<Mood, Pose> = {
  pour: 'pour',
  happy: 'happy',
  unsure: 'unsure',
  alarmed: 'alarmed',
  relieved: 'happy',
  serious: 'pour', // careful and focused on the pour — the "check first" face
}

const LINE: Record<Mood, string> = {
  pour: 'One bite. One question.',
  happy: 'Crisp! Nothing to worry about.',
  unsure: 'Hmm… this pani smells off.',
  alarmed: 'Phoot gaya! Don’t drink it.',
  relieved: 'Fixed. Still boiling mine.',
  serious: 'Somebody has to check first.',
}

const ALT: Record<Pose, string> = {
  pour: 'A student pouring pani from a steel glass into a golgappa',
  happy: 'The student laughing as she holds up a golgappa',
  unsure: 'The student sniffing a golgappa suspiciously',
  alarmed: 'The student holding out a cracked, dripping golgappa in alarm',
}

export function PaniGirl({className = ''}: {idPrefix?: string; className?: string}) {
  const [mood, setMood] = useState<Mood>('pour')

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-mood]'))
    if (sections.length === 0) return
    const last = sections[sections.length - 1]

    // One rule, checked on every scroll frame:
    //  - at the very bottom, the last section wins (it is too short to ever
    //    reach the middle of the screen);
    //  - otherwise, whichever section crosses the middle of the screen is the
    //    one you are reading.
    let frame = 0
    const decide = () => {
      frame = 0
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24
      if (atBottom && last.dataset.mood) {
        setMood(last.dataset.mood as Mood)
        return
      }
      const middle = window.innerHeight / 2
      for (const section of sections) {
        const box = section.getBoundingClientRect()
        if (box.top <= middle && box.bottom >= middle && section.dataset.mood) {
          setMood(section.dataset.mood as Mood)
          return
        }
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(decide)
    }

    decide()
    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const pose = POSE_FOR[mood]

  return (
    <figure className={`${styles.wrap} ${className}`} data-face={mood}>
      <figcaption className={styles.bubble} key={mood} aria-live="polite">
        {LINE[mood]}
      </figcaption>

      <div className={styles.stage}>
        {POSES.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element -- four small transparent webps, stacked for a crossfade
          <img
            key={p}
            src={`/girl/${p}.webp`}
            alt={p === pose ? ALT[p] : ''}
            aria-hidden={p === pose ? undefined : true}
            width={560}
            height={833}
            decoding="async"
            className={p === pose ? `${styles.pose} ${styles.active}` : styles.pose}
          />
        ))}
      </div>
    </figure>
  )
}
