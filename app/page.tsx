import Link from 'next/link'

import {Golgappa} from '@/components/Golgappa'
import {MapPanel} from '@/components/MapPanel'
import {Disclaimer, SiteHeader} from '@/components/SiteHeader'
import {STATE_LABEL, STATE_ORDER, type AreaState} from '@/lib/states'
import {fetchSanity, sanityConfigured} from '@/sanity/lib/fetch'
import {AREAS_QUERY} from '@/sanity/lib/queries'

import styles from './page.module.css'

type AreaRow = {
  _id: string
  name: string
  nameHi?: string
  city: string
  state: AreaState
  stateReason?: string
  slug: string
  lat: number
  lng: number
  radiusM?: number
}

export default async function Home() {
  const areas = await fetchSanity<AreaRow[]>(AREAS_QUERY)
  const mappable = (areas ?? []).filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number')

  const centre: [number, number] = mappable.length
    ? [
        mappable.reduce((sum, a) => sum + a.lat, 0) / mappable.length,
        mappable.reduce((sum, a) => sum + a.lng, 0) / mappable.length,
      ]
    : [22.7196, 75.8577]

  const counts = STATE_ORDER.map((state) => ({
    state,
    n: (areas ?? []).filter((a) => a.state === state).length,
  })).filter((c) => c.n > 0)

  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <h1 className={styles.h1}>Is the water in your area safe today?</h1>
        <p className={styles.lede}>
          Residents report what they notice. A health worker checks the pattern before any warning
          goes out.
        </p>

        {!sanityConfigured ? (
          <SetupCard />
        ) : (
          <>
            {mappable.length > 0 && <MapPanel areas={mappable} centre={centre} />}

            {counts.length > 0 && (
              <ul className={styles.counts}>
                {counts.map(({state, n}) => (
                  <li key={state} className={`${styles.count} ${styles[state]}`}>
                    <Golgappa state={state} size={22} />
                    <span>
                      <strong>{n}</strong> {STATE_LABEL[state].toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Link href="/report" className={styles.cta}>
              Report a problem
            </Link>

            <h2 className={styles.h2}>Areas near you</h2>
            {areas && areas.length > 0 ? (
              <ul className={styles.list}>
                {areas.map((area) => (
                  <li key={area._id}>
                    <Link href={`/area/${area.slug}`} className={styles.row}>
                      <Golgappa state={area.state} size={40} />
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>
                          {area.name}
                          <span className={`${styles.chip} ${styles[area.state]}`}>
                            {STATE_LABEL[area.state]}
                          </span>
                        </span>
                        <span className={styles.reason}>{area.stateReason ?? area.city}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>
                No areas yet. Run <code>node scripts/make-seed.mjs</code> and import{' '}
                <code>seed.ndjson</code>, then reload.
              </p>
            )}
          </>
        )}

        <Disclaimer />
      </main>
    </div>
  )
}

function SetupCard() {
  return (
    <section className={styles.setup}>
      <h2>Finish the Sanity setup</h2>
      <p>The app is wired up but has no project to read from yet. Run these, in order:</p>
      <ol>
        <li>
          <code>npx sanity login</code>
        </li>
        <li>
          <code>npx sanity init --env .env.local</code> — new project, dataset <code>production</code>
        </li>
        <li>
          <code>node scripts/make-seed.mjs</code>
        </li>
        <li>
          <code>npx sanity dataset import seed.ndjson production --replace</code>
        </li>
      </ol>
      <p>
        Then reload. The Studio is at <Link href="/studio">/studio</Link>.
      </p>
    </section>
  )
}
