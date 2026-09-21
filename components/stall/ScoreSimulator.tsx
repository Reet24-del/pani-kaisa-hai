'use client'

import {useMemo, useState} from 'react'

import {Golgappa} from '@/components/Golgappa'
import {DEFAULT_SETTINGS, scoreReports, type Limit, type ReportLike} from '@/lib/risk'
import type {AreaState} from '@/lib/states'

import styles from './ScoreSimulator.module.css'

/**
 * "Shake the golgappa": pile on signals and watch the golgappa react.
 *
 * This runs `scoreReports` from lib/risk.ts — the exact function the report
 * route uses — on made-up reports, so what you see here is the real rule, not
 * an illustration of it. The one thing it will not do on its own is turn the
 * golgappa red: that needs the "health worker confirms" button, because in the
 * app it needs a person.
 */

const TDS: Limit = {code: 'tds', parameter: 'TDS', unit: 'mg/L', rule: 'max', acceptableMax: 500, permissibleMax: 2000}
const ECOLI: Limit = {code: 'ecoli', parameter: 'E. coli', rule: 'absent'}

const MAX_SCALE = 9

export function ScoreSimulator() {
  const [smells, setSmells] = useState(0)
  const [ill, setIll] = useState(0)
  const [tds, setTds] = useState(false)
  const [rain, setRain] = useState(false)
  const [bacteria, setBacteria] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const score = useMemo(() => {
    const now = new Date()
    const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600_000).toISOString()
    const reports: ReportLike[] = []

    for (let i = 0; i < smells; i++) {
      reports.push({_id: `s${i}`, deviceHash: `phone-${i}`, submittedAt: at(i + 1), waterSigns: ['smell']})
    }
    for (let i = 0; i < ill; i++) {
      reports.push({_id: `h${i}`, deviceHash: `home-${i}`, submittedAt: at(i + 2), illness: {households: 1, people: 2}})
    }
    if (tds) {
      reports.push({_id: 'tds', deviceHash: 'kit-1', submittedAt: at(3), readings: [{value: 780, parameter: TDS}]})
    }
    if (bacteria) {
      reports.push({_id: 'eco', deviceHash: 'kit-2', submittedAt: at(4), readings: [{detected: true, parameter: ECOLI}]})
    }

    return scoreReports(reports, DEFAULT_SETTINGS, {now, rainMm48h: rain ? 62 : 0})
  }, [smells, ill, tds, rain, bacteria])

  // Changing the evidence un-confirms: a person decided on different facts.
  const change = <T,>(set: (v: T) => void) => (v: T) => {
    setConfirmed(false)
    set(v)
  }
  // Steppers use functional updates so fast double-taps both count.
  const step = (set: (fn: (v: number) => number) => void, max: number) => (delta: number) => {
    setConfirmed(false)
    set((v) => Math.max(0, Math.min(max, v + delta)))
  }

  const needsPerson = score.status === 'needsVerification'
  const state: AreaState = confirmed ? 'phoot' : score.status === 'logged' ? 'crisp' : 'soggy'

  const headline = confirmed
    ? 'Phoot gaya — the alert goes out'
    : needsPerson
      ? 'A health worker is called in'
      : score.status === 'watch'
        ? 'Soggy — everyone nearby is told to boil'
        : score.score > 0
          ? 'Logged. Not enough to warn anyone yet'
          : 'Crisp. Nothing reported'

  const explain = confirmed
    ? 'A named person looked at the evidence and confirmed it. Only now does the area turn red.'
    : needsPerson
      ? score.bacteria
        ? 'Bacteria found — that skips the score and goes straight to a person. The machine stops here.'
        : 'Six points. The machine has done all it is allowed to do. Now a person decides.'
      : score.status === 'watch'
        ? 'Three points turns an area soggy on its own, so a warning never waits on anyone.'
        : 'One person noticing something is a report, not a pattern.'

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Stepper
          label="Neighbours who smelled something"
          hint="+1 each, counted once per phone"
          value={smells}
          max={6}
          onStep={step(setSmells, 6)}
        />
        <Stepper
          label="Homes where someone is ill"
          hint="+2 each"
          value={ill}
          max={3}
          onStep={step(setIll, 3)}
        />
        <Toggle label="A TDS reading of 780 mg/L" hint="over the 500 limit · +2" on={tds} onChange={change(setTds)} />
        <Toggle label="Heavy rain in the last 2 days" hint="62 mm · +1" on={rain} onChange={change(setRain)} />
        <Toggle label="An E. coli strip turns positive" hint="skips the score" on={bacteria} onChange={change(setBacteria)} />
      </div>

      <div className={`${styles.result} ${styles[state]}`} aria-live="polite">
        <div className={styles.glyphWrap} key={state}>
          <Golgappa state={state} size={132} />
        </div>

        <p className={styles.headline}>{headline}</p>
        <p className={styles.explain}>{explain}</p>

        <div className={styles.meter} role="img" aria-label={`Risk score ${score.score} of ${MAX_SCALE}`}>
          <div
            className={styles.fill}
            style={{width: `${Math.min(100, (score.score / MAX_SCALE) * 100)}%`}}
          />
          <span className={styles.mark} style={{left: `${(3 / MAX_SCALE) * 100}%`}}>
            <span>soggy</span>
          </span>
          <span className={styles.mark} style={{left: `${(6 / MAX_SCALE) * 100}%`}}>
            <span>person</span>
          </span>
        </div>
        <p className={styles.sum}>
          <span className="num">{score.score}</span> points
          {score.lines.length > 0 ? (
            <span className={styles.lines}>
              {' '}
              ={' '}
              {score.lines.map((l) => (l.points ? `${l.label} (+${l.points})` : l.label)).join(' · ')}
            </span>
          ) : null}
        </p>

        <button
          type="button"
          className={styles.confirm}
          disabled={!needsPerson || confirmed}
          onClick={() => setConfirmed(true)}
        >
          {confirmed ? 'Confirmed by a health worker' : 'Health worker confirms →'}
        </button>
        {!needsPerson && !confirmed ? (
          <p className={styles.locked}>Locked until the evidence reaches a person.</p>
        ) : null}
      </div>
    </div>
  )
}

function Stepper({
  label,
  hint,
  value,
  max,
  onStep,
}: {
  label: string
  hint: string
  value: number
  max: number
  onStep: (delta: number) => void
}) {
  return (
    <div className={styles.control}>
      <span className={styles.label}>
        {label}
        <small>{hint}</small>
      </span>
      <span className={styles.stepper}>
        <button type="button" aria-label={`Fewer: ${label}`} onClick={() => onStep(-1)} disabled={value === 0}>
          −
        </button>
        <span className="num" aria-live="polite">
          {value}
        </span>
        <button type="button" aria-label={`More: ${label}`} onClick={() => onStep(1)} disabled={value === max}>
          +
        </button>
      </span>
    </div>
  )
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string
  hint: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button type="button" className={styles.control} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className={styles.label}>
        {label}
        <small>{hint}</small>
      </span>
      <span className={on ? `${styles.switch} ${styles.on}` : styles.switch} aria-hidden="true" />
    </button>
  )
}
