import {cookies} from 'next/headers'

import {CaseCard} from '@/components/control/CaseCard'
import {SignIn} from '@/components/control/SignIn'
import {VerifierPicker} from '@/components/control/VerifierPicker'
import {Golgappa} from '@/components/Golgappa'
import {fetchSanity, sanityConfigured} from '@/sanity/lib/fetch'

import styles from './control.module.css'

export const dynamic = 'force-dynamic'

const QUEUE = `{
  "needsVerification": *[_type == "waterCase" && status == "needsVerification"]
    | order(riskScore desc, openedAt asc){
      _id, riskScore, scoreBreakdown, aiSummary, status, openedAt,
      "area": area->{_id, name, "slug": slug.current, state},
      "claimedBy": claimedBy->{name},
      "suspectedSource": suspectedSource->{name, kind},
      "reports": reports[]->{
        _id, submittedAt, waterSigns, sourceKind,
        "peopleIll": illness.people,
        "readings": readings[]{value, detected, method, "parameter": parameter->{parameter, unit, rule, acceptableMin, acceptableMax, permissibleMax}}
      }
    },
  "watch": *[_type == "waterCase" && status == "watch"] | order(riskScore desc)[0...10]{
    _id, riskScore, scoreBreakdown, "area": area->{name, "slug": slug.current}
  },
  "alerts": *[_type == "alert" && !defined(resolvedAt)] | order(issuedAt desc){
    _id, issuedAt, "area": area->{name}, "verifiedBy": verifiedBy->{name}
  },
  "verifiers": *[_type == "contact" && canVerify == true]{_id, name, role}
}`

type Queue = {
  needsVerification: CaseRow[]
  watch: {_id: string; riskScore: number; scoreBreakdown?: string; area?: {name: string; slug: string}}[]
  alerts: {_id: string; issuedAt: string; area?: {name: string}; verifiedBy?: {name: string}}[]
  verifiers: {_id: string; name: string; role: string}[]
}

export type CaseRow = {
  _id: string
  riskScore: number
  scoreBreakdown?: string
  aiSummary?: string
  status: string
  openedAt?: string
  area?: {_id: string; name: string; slug: string; state: string}
  claimedBy?: {name: string}
  suspectedSource?: {name: string; kind: string}
  reports?: {
    _id: string
    submittedAt: string
    waterSigns?: string[]
    sourceKind?: string
    peopleIll?: number
    readings?: {
      value?: number
      detected?: boolean
      method?: string
      parameter?: {
        parameter: string
        unit?: string
        rule: string
        acceptableMin?: number
        acceptableMax?: number
        permissibleMax?: number
      }
    }[]
  }[]
}

export default async function ControlRoom() {
  const jar = await cookies()
  const signedIn = jar.get('pkh_control')?.value === (process.env.CONTROL_ROOM_PASSPHRASE || 'pani-demo')
  const verifierId = jar.get('pkh_verifier')?.value ?? null

  if (!sanityConfigured) {
    return (
      <main className={styles.gate}>
        <p>Sanity isn’t set up yet. Finish the setup on the home page first.</p>
      </main>
    )
  }

  if (!signedIn) {
    return <SignIn />
  }

  const queue = await fetchSanity<Queue>(QUEUE)
  const cases = queue?.needsVerification ?? []
  const verifier = queue?.verifiers.find((v) => v._id === verifierId) ?? null

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <span className={styles.brand}>
          <Golgappa state="soggy" size={28} />
          Control Room
        </span>
        <VerifierPicker verifiers={queue?.verifiers ?? []} current={verifier} />
      </header>

      <p className={styles.note}>
        Web version, so it can be tested without a Sanity login. The App SDK app in{' '}
        <code>control-room/</code> is the same queue inside the Sanity Dashboard, and both call the
        same code — only a person can confirm or dismiss.
      </p>

      <main className={styles.main}>
        <section>
          <h1 className={styles.h1}>
            Needs verification <span className={styles.count}>{cases.length}</span>
          </h1>
          {cases.length === 0 ? (
            <p className={styles.empty}>Nothing to verify right now.</p>
          ) : (
            <ul className={styles.list}>
              {cases.map((row) => (
                <li key={row._id}>
                  <CaseCard row={row} canDecide={Boolean(verifier)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.side}>
          <section>
            <h2 className={styles.h2}>Watch ({queue?.watch.length ?? 0})</h2>
            <p className={styles.sideNote}>Soggy on the map already. No person needed yet.</p>
            <ul className={styles.plain}>
              {(queue?.watch ?? []).map((c) => (
                <li key={c._id}>
                  <strong>{c.area?.name}</strong> <span className="mono">{c.riskScore}</span>
                  <br />
                  <span className={styles.sideNote}>{c.scoreBreakdown}</span>
                </li>
              ))}
              {(queue?.watch ?? []).length === 0 ? <li className={styles.sideNote}>Empty.</li> : null}
            </ul>
          </section>

          <section>
            <h2 className={styles.h2}>Active alerts ({queue?.alerts.length ?? 0})</h2>
            <ul className={styles.plain}>
              {(queue?.alerts ?? []).map((a) => (
                <li key={a._id}>
                  <strong>{a.area?.name}</strong>
                  <br />
                  <span className={styles.sideNote}>
                    confirmed by {a.verifiedBy?.name ?? 'unknown'} ·{' '}
                    {new Date(a.issuedAt).toLocaleDateString('en-IN')}
                  </span>
                </li>
              ))}
              {(queue?.alerts ?? []).length === 0 ? <li className={styles.sideNote}>None.</li> : null}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  )
}
