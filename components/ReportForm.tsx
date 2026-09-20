'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'

import {areaForPoint, type PlaceableArea} from '@/lib/geo'

import styles from './ReportForm.module.css'

export type LimitOption = {
  _id: string
  parameter: string
  code: string
  unit?: string
  rule: string
}

type Step = 1 | 2 | 3 | 4
type Point = {lat: number; lng: number}

const SIGNS: {value: string; label: string; hint: string}[] = [
  {value: 'smell', label: 'Smell', hint: 'sewage, chemicals'},
  {value: 'colour', label: 'Colour', hint: 'yellow, brown, cloudy'},
  {value: 'taste', label: 'Taste', hint: 'salty, bitter'},
  {value: 'particles', label: 'Particles', hint: 'grit, worms, oil'},
]

const SOURCES: {value: string; label: string}[] = [
  {value: 'pipeline', label: 'Tap (municipal)'},
  {value: 'borewell', label: 'Borewell'},
  {value: 'tanker', label: 'Tanker'},
  {value: 'ro', label: 'RO plant'},
  {value: 'unknown', label: 'Not sure'},
]

const SYMPTOMS = ['diarrhoea', 'vomiting', 'fever', 'jaundice']

export function ReportForm({
  areas,
  limits,
  initialAreaSlug,
}: {
  areas: PlaceableArea[]
  limits: LimitOption[]
  initialAreaSlug?: string
}) {
  const initialArea = areas.find((a) => a.slug === initialAreaSlug)

  const [step, setStep] = useState<Step>(1)
  const [point, setPoint] = useState<Point | null>(
    initialArea ? {lat: initialArea.lat, lng: initialArea.lng} : null,
  )
  const [areaId, setAreaId] = useState<string | null>(initialArea?._id ?? null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  const [signs, setSigns] = useState<string[]>([])
  const [sourceKind, setSourceKind] = useState('pipeline')
  const [people, setPeople] = useState(0)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [readings, setReadings] = useState<Record<string, string>>({})
  const [bacteria, setBacteria] = useState<Record<string, boolean>>({})
  const [phone, setPhone] = useState('')

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{area: {name: string; slug: string} | null; unmapped: boolean} | null>(
    null,
  )

  const area = useMemo(() => {
    if (areaId) return areas.find((a) => a._id === areaId) ?? null
    return point ? areaForPoint(point, areas) : null
  }, [areaId, point, areas])

  function useMyLocation() {
    setLocateError(null)
    if (!('geolocation' in navigator)) {
      setLocateError('This browser cannot share a location. Pick your area from the list instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({lat: position.coords.latitude, lng: position.coords.longitude})
        setAreaId(null)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocateError('Could not get your location. Pick your area from the list instead.')
      },
      {enableHighAccuracy: true, timeout: 8000},
    )
  }

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function submit() {
    setSending(true)
    setError(null)
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          lat: point?.lat,
          lng: point?.lng,
          areaId: areaId ?? area?._id,
          sourceKind,
          waterSigns: signs,
          people,
          households: people > 0 ? 1 : 0,
          symptoms,
          readings: [
            ...Object.entries(readings)
              .filter(([, v]) => v !== '')
              .map(([parameterId, v]) => ({parameterId, value: Number(v), method: 'strip'})),
            ...Object.entries(bacteria).map(([parameterId, detected]) => ({
              parameterId,
              detected,
              method: 'strip',
            })),
          ],
          contact: phone ? {phone} : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Could not send the report. Try again.')
        return
      }
      setDone({area: data.area, unmapped: data.unmapped})
    } catch {
      setError('No connection. Your report was not sent — try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className={styles.done}>
        <h1 className={styles.doneTitle}>Report sent. Thank you.</h1>
        {done.unmapped ? (
          <p>
            Your spot isn’t on our map yet, so we’ve kept the report for someone to place. It still
            counts.
          </p>
        ) : (
          <p>
            It has been added to {done.area?.name}. If more neighbours report the same thing, a
            health worker sees all of it together — nobody is named.
          </p>
        )}
        <p className={styles.doneNext}>
          Until you hear otherwise, boiling water for one minute is the safe thing to do.
        </p>
        <div className={styles.doneLinks}>
          {done.area ? (
            <Link href={`/area/${done.area.slug}`} className={styles.primary}>
              See {done.area.name}
            </Link>
          ) : null}
          <Link href="/" className={styles.secondary}>
            Back to the map
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <ol className={styles.dots} aria-label={`Step ${step} of 4`}>
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className={n <= step ? styles.dotOn : styles.dot} />
        ))}
      </ol>

      {step === 1 && (
        <section className={styles.step}>
          <h1 className={styles.q}>Where are you?</h1>
          <button type="button" className={styles.primary} onClick={useMyLocation} disabled={locating}>
            {locating ? 'Finding you…' : 'Use my location'}
          </button>
          {locateError ? <p className={styles.error}>{locateError}</p> : null}

          <label className={styles.label} htmlFor="area-select">
            Or pick your area
          </label>
          <select
            id="area-select"
            className={styles.select}
            value={areaId ?? ''}
            onChange={(event) => {
              const next = areas.find((a) => a._id === event.target.value)
              setAreaId(next?._id ?? null)
              if (next) setPoint({lat: next.lat, lng: next.lng})
            }}
          >
            <option value="">Choose an area…</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>

          {point ? (
            <p className={styles.resolved}>
              {area ? (
                <>
                  Reporting for <strong>{area.name}</strong>.
                </>
              ) : (
                <>This spot is outside every mapped area. You can still send the report.</>
              )}
            </p>
          ) : null}

          <Nav onNext={() => setStep(2)} nextDisabled={!point} />
        </section>
      )}

      {step === 2 && (
        <section className={styles.step}>
          <h1 className={styles.q}>What did you notice?</h1>
          <div className={styles.grid}>
            {SIGNS.map((sign) => {
              const on = signs.includes(sign.value)
              return (
                <button
                  key={sign.value}
                  type="button"
                  className={on ? styles.choiceOn : styles.choice}
                  aria-pressed={on}
                  onClick={() => toggle(signs, sign.value, setSigns)}
                >
                  <strong>{sign.label}</strong>
                  <span>{sign.hint}</span>
                </button>
              )
            })}
          </div>

          <label className={styles.label} htmlFor="source-select">
            Where does this water come from?
          </label>
          <select
            id="source-select"
            className={styles.select}
            value={sourceKind}
            onChange={(event) => setSourceKind(event.target.value)}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </section>
      )}

      {step === 3 && (
        <section className={styles.step}>
          <h1 className={styles.q}>Is anyone at home ill?</h1>
          <div className={styles.row}>
            <button
              type="button"
              className={people === 0 ? styles.choiceOn : styles.choice}
              onClick={() => {
                setPeople(0)
                setSymptoms([])
              }}
            >
              <strong>No one</strong>
            </button>
            <div className={styles.counter}>
              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => setPeople(Math.max(0, people - 1))}
                aria-label="One fewer person"
              >
                −
              </button>
              <span className={`${styles.counterValue} mono`}>{people}</span>
              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => setPeople(people + 1)}
                aria-label="One more person"
              >
                +
              </button>
            </div>
          </div>

          {people > 0 && (
            <>
              <p className={styles.label}>What are they feeling?</p>
              <div className={styles.grid}>
                {SYMPTOMS.map((symptom) => {
                  const on = symptoms.includes(symptom)
                  return (
                    <button
                      key={symptom}
                      type="button"
                      className={on ? styles.choiceOn : styles.choice}
                      aria-pressed={on}
                      onClick={() => toggle(symptoms, symptom, setSymptoms)}
                    >
                      <strong>{symptom}</strong>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <Nav onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </section>
      )}

      {step === 4 && (
        <section className={styles.step}>
          <h1 className={styles.q}>Anything else? (optional)</h1>
          <p className={styles.help}>
            Skip this if you don’t have a test kit. A reading makes your report count for more.
          </p>

          {limits.map((limit) =>
            limit.rule === 'absent' ? (
              <div key={limit._id} className={styles.readingRow}>
                <span>{limit.parameter}</span>
                <div className={styles.row}>
                  <button
                    type="button"
                    className={bacteria[limit._id] === true ? styles.smallOn : styles.small}
                    onClick={() => setBacteria({...bacteria, [limit._id]: true})}
                  >
                    Detected
                  </button>
                  <button
                    type="button"
                    className={bacteria[limit._id] === false ? styles.smallOn : styles.small}
                    onClick={() => setBacteria({...bacteria, [limit._id]: false})}
                  >
                    Not detected
                  </button>
                </div>
              </div>
            ) : (
              <div key={limit._id} className={styles.readingRow}>
                <label htmlFor={`reading-${limit._id}`}>
                  {limit.parameter}
                  {limit.unit ? <span className={styles.unit}> ({limit.unit})</span> : null}
                </label>
                <input
                  id={`reading-${limit._id}`}
                  className={styles.input}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={readings[limit._id] ?? ''}
                  onChange={(event) => setReadings({...readings, [limit._id]: event.target.value})}
                />
              </div>
            ),
          )}

          <label className={styles.label} htmlFor="phone">
            Phone number, only if a health worker may call you
          </label>
          <input
            id="phone"
            className={styles.input}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="optional"
          />
          <p className={styles.help}>This is never shown on any public page.</p>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.nav}>
            <button type="button" className={styles.secondary} onClick={() => setStep(3)}>
              Back
            </button>
            <button type="button" className={styles.primary} onClick={submit} disabled={sending}>
              {sending ? 'Sending…' : 'Send report'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function Nav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className={styles.nav}>
      {onBack ? (
        <button type="button" className={styles.secondary} onClick={onBack}>
          Back
        </button>
      ) : (
        <span />
      )}
      <button type="button" className={styles.primary} onClick={onNext} disabled={nextDisabled}>
        Next
      </button>
    </div>
  )
}
