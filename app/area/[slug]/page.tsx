import Link from 'next/link'
import {notFound} from 'next/navigation'

import {Golgappa} from '@/components/Golgappa'
import {Disclaimer, SiteHeader} from '@/components/SiteHeader'
import {STATE_LABEL, STATE_MEANING, type AreaState} from '@/lib/states'
import {fetchSanity, sanityConfigured} from '@/sanity/lib/fetch'
import {AREA_QUERY} from '@/sanity/lib/queries'

import styles from './area.module.css'

type Reading = {
  value?: number
  detected?: boolean
  method?: string
  parameter?: {parameter: string; unit?: string; code?: string}
}

type Report = {
  _id: string
  submittedAt: string
  waterSigns?: string[]
  sourceKind?: string
  peopleIll?: number
  readings?: Reading[]
}

type Area = {
  _id: string
  name: string
  nameHi?: string
  city: string
  state: AreaState
  stateReason?: string
  stateChangedAt?: string
  slug: string
  advice?: {headlineEn: string; headlineHi?: string; textEn: string; textHi?: string}
  activeAlert?: {
    severity: string
    precautionsEn: string
    precautionsHi?: string
    issuedAt: string
    verifiedBy?: {name: string; role: string}
  }
  reports?: Report[]
  sources?: {_id: string; name: string; kind: string}[]
}

const SIGN_LABEL: Record<string, string> = {
  smell: 'smell',
  colour: 'colour',
  taste: 'taste',
  particles: 'particles',
}

function day(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})
}

export default async function AreaPage({params}: PageProps<'/area/[slug]'>) {
  const {slug} = await params

  if (!sanityConfigured) {
    return (
      <div className={styles.page}>
        <SiteHeader back={{href: '/', label: 'Map'}} />
        <main className={styles.main}>
          <p>Sanity isn’t set up yet. See the steps on the home page.</p>
        </main>
      </div>
    )
  }

  const area = await fetchSanity<Area>(AREA_QUERY, {slug})
  if (!area) notFound()

  const alert = area.activeAlert
  const reports = area.reports ?? []

  return (
    <div className={styles.page}>
      <SiteHeader back={{href: '/', label: 'Map'}} />

      <main className={styles.main}>
        <div className={`${styles.hero} ${styles[area.state]}`}>
          <Golgappa state={area.state} size={84} />
          <div>
            <h1 className={styles.h1}>{area.name}</h1>
            {area.nameHi ? (
              <p lang="hi" className={styles.hi}>
                {area.nameHi}
              </p>
            ) : null}
            <p className={styles.stateLine}>
              <strong>{STATE_LABEL[area.state]}</strong> — {STATE_MEANING[area.state]}
              {area.stateChangedAt ? <span className={styles.since}> · since {day(area.stateChangedAt)}</span> : null}
            </p>
          </div>
        </div>

        <section className={styles.block}>
          <h2 className={styles.h2}>What to do</h2>
          <p className={styles.advice}>
            {alert?.precautionsEn ?? area.advice?.textEn ?? 'Nothing unusual has been reported here.'}
          </p>
          {(alert?.precautionsHi ?? area.advice?.textHi) ? (
            <p lang="hi" className={styles.adviceHi}>
              {alert?.precautionsHi ?? area.advice?.textHi}
            </p>
          ) : null}
          {alert?.verifiedBy ? (
            <p className={styles.verified}>
              Confirmed on {day(alert.issuedAt)} by {alert.verifiedBy.name}.
            </p>
          ) : null}
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>Why</h2>
          <p>{area.stateReason ?? 'No reports in the last 14 days.'}</p>
          <details className={styles.how}>
            <summary>How this is decided</summary>
            <p>
              Reports from the same area within 72 hours are scored: each new reporter adds 1,
              a household with illness adds 2, a test reading past the acceptable limit adds 2,
              past the permissible limit adds 3. At 3 the area turns soggy on its own. At 6, or
              the moment bacteria are found, a health worker has to look at it — and only a person
              can confirm contamination.
            </p>
          </details>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>Reports (last 14 days)</h2>
          {reports.length === 0 ? (
            <p className={styles.muted}>Nothing reported here recently.</p>
          ) : (
            <ul className={styles.reports}>
              {reports.map((r) => {
                const signs = (r.waterSigns ?? []).map((s) => SIGN_LABEL[s] ?? s).join(', ')
                return (
                  <li key={r._id} className={styles.report}>
                    <span className={`${styles.when} mono`}>{day(r.submittedAt)}</span>
                    <span className={styles.what}>
                      {signs || 'no water signs'}
                      {r.peopleIll ? ` · ${r.peopleIll} person${r.peopleIll === 1 ? '' : 's'} ill` : ''}
                      {(r.readings ?? []).map((reading, i) => (
                        <span key={i} className={styles.reading}>
                          {reading.parameter?.parameter}{' '}
                          <span className="mono">
                            {reading.value ?? (reading.detected ? 'detected' : 'not detected')}
                          </span>
                          {reading.parameter?.unit ? ` ${reading.parameter.unit}` : ''}
                        </span>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className={styles.muted}>
            Reporters are never named, and pins are placed at the area centre, not at anyone’s home.
          </p>
        </section>

        {area.state === 'phoot' && area.sources && area.sources.length > 0 ? (
          <section className={styles.block}>
            <h2 className={styles.h2}>Water source</h2>
            <ul className={styles.sources}>
              {area.sources.map((s) => (
                <li key={s._id}>
                  {s.name} <span className={styles.muted}>({s.kind})</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link href={`/report?area=${area.slug}`} className={styles.cta}>
          Report a problem here
        </Link>

        <Disclaimer />
      </main>
    </div>
  )
}
