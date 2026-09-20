import Link from 'next/link'

import {Golgappa} from '@/components/Golgappa'
import {MapPanel} from '@/components/MapPanel'
import {PourHero} from '@/components/PourHero'
import {STATE_LABEL, STATE_MEANING, STATE_ORDER, type AreaState} from '@/lib/states'
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

const STATE_ACTION: Record<AreaState, string> = {
  crisp: 'Drink as usual.',
  soggy: 'Boil for one minute first.',
  phoot: 'Do not drink the tap water.',
  fresh: 'Fixed. Stay careful a few more days.',
}

const STATE_TRIGGER: Record<AreaState, string> = {
  crisp: 'Nothing reported here recently.',
  soggy: 'Three or more signals in 72 hours. Automatic — no one has to wait for a person.',
  phoot: 'A health worker checked the evidence and confirmed it. Never automatic.',
  fresh: 'The repair was recorded. Back to crisp after five quiet days.',
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

  const city = areas?.[0]?.city

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <span className={styles.brand}>
          <Golgappa state="crisp" size={30} />
          <span className={styles.brandText}>
            <strong>Pani Kaisa Hai?</strong>
            <span lang="hi">पानी कैसा है?</span>
          </span>
        </span>
        <Link href="/report" className={styles.barCta}>
          Report
        </Link>
      </header>

      <p className={styles.sample}>Sample data — demo build</p>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>{city ? `${city} · live` : 'Live neighbourhood water watch'}</p>
          <h1 className={styles.h1}>
            Before the first bite, everyone asks: <em>is this pani clean?</em>
          </h1>
          <p className={styles.lede}>
            Ask it about your tap. Neighbours report what they notice, the signals are added up
            against India’s drinking-water standard, and a health worker checks before anyone is
            warned.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/report" className={styles.primary}>
              Report a problem
            </Link>
            <a href="#map" className={styles.secondary}>
              See my area
            </a>
          </div>
          <p className={styles.trust}>
            Takes under a minute · No sign-up · Your name is never shown
          </p>
        </div>

        <div className={styles.heroArt}>
          <PourHero />
          <p className={styles.heroCaption}>
            One puri, one mouthful of pani. Same question, bigger stakes.
          </p>
        </div>
      </section>

      {/* ── The four states ──────────────────────────────────── */}
      <section className={styles.states} aria-labelledby="states-title">
        <h2 id="states-title" className={styles.h2}>
          Every neighbourhood is a golgappa
        </h2>
        <p className={styles.sectionLede}>
          The shape tells you the state before the colour does — crisp, soggy, burst, fresh.
        </p>
        <ul className={styles.stateGrid}>
          {STATE_ORDER.map((state) => (
            <li key={state} className={`${styles.stateCard} ${styles[state]}`}>
              <Golgappa state={state} size={56} />
              <h3 className={styles.stateName}>{STATE_LABEL[state]}</h3>
              <p className={styles.stateMeaning}>{STATE_MEANING[state]}</p>
              <p className={styles.stateAction}>{STATE_ACTION[state]}</p>
              <p className={styles.stateTrigger}>{STATE_TRIGGER[state]}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Map + areas ──────────────────────────────────────── */}
      <section id="map" className={styles.mapSection}>
        <h2 className={styles.h2}>{city ? `Water in ${city} today` : 'Water near you today'}</h2>

        {!sanityConfigured ? (
          <SetupCard />
        ) : (
          <>
            {counts.length > 0 && (
              <ul className={styles.counts}>
                {counts.map(({state, n}) => (
                  <li key={state} className={`${styles.count} ${styles[state]}`}>
                    <Golgappa state={state} size={22} />
                    <span>
                      <strong className="num">{n}</strong> {STATE_LABEL[state].toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {mappable.length > 0 && <MapPanel areas={mappable} centre={centre} />}

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
                      <span className={styles.rowGo} aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>
                No areas yet. Run <code>node scripts/make-seed.mjs</code>, import{' '}
                <code>seed.ndjson</code>, then reload.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className={styles.how}>
        <h2 className={styles.h2}>How a complaint becomes a warning</h2>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNo}>01</span>
            <h3 className={styles.stepTitle}>You notice something</h3>
            <p>
              Smell, colour, taste, grit — or someone at home is ill. Four taps, no account, under a
              minute.
            </p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNo}>02</span>
            <h3 className={styles.stepTitle}>The signals are added up</h3>
            <p>
              Reports from one area inside 72 hours are scored together, and any test readings are
              checked against IS 10500. Three taps from one phone still count once.
            </p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNo}>03</span>
            <h3 className={styles.stepTitle}>A person decides</h3>
            <p>
              At six points, or the moment bacteria show up, a health worker sees the whole case and
              confirms or dismisses it — with a reason that goes on the record.
            </p>
          </li>
        </ol>
        <p className={styles.honest}>
          A machine can raise a case. Only a person can declare the water unsafe.
        </p>
      </section>

      <footer className={styles.footer}>
        <Golgappa state="phoot" size={34} />
        <div>
          <p className={styles.footerLine}>
            Early warning from residents, not a lab test. Boiling water for one minute is the safe
            thing to do while you wait.
          </p>
          <p className={styles.footerMeta}>
            Built for the DEV Sanity Challenge · <Link href="/studio">Studio</Link> ·{' '}
            <Link href="/control">Control room</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

function SetupCard() {
  return (
    <section className={styles.setup}>
      <h3>Finish the Sanity setup</h3>
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
