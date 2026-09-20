import Link from 'next/link'

import {Golgappa, STATE_LABEL, type AreaState} from '@/components/Golgappa'

import styles from './page.module.css'

// The map lands in the next milestone (PRD P0-2). Until then this list view is
// the accessible fallback the map will keep anyway (DESIGN.md §10).
export const revalidate = 30

type AreaRow = {
  _id: string
  name: string
  nameHi?: string
  city: string
  state: AreaState
  stateReason?: string
  slug: string
}

async function getAreas(): Promise<AreaRow[] | null> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return null
  const [{client}, {AREAS_QUERY}] = await Promise.all([
    import('@/sanity/lib/client'),
    import('@/sanity/lib/queries'),
  ])
  return client.fetch(AREAS_QUERY) as Promise<AreaRow[]>
}

export default async function Home() {
  const areas = await getAreas()

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <div className={styles.brand}>
          <Golgappa state="crisp" size={32} />
          <div>
            <strong>Pani Kaisa Hai?</strong>
            <span lang="hi" className={styles.hi}>
              पानी कैसा है?
            </span>
          </div>
        </div>
      </header>

      <p className={styles.sample}>Sample data — demo build</p>

      <main className={styles.main}>
        <h1 className={styles.h1}>Is the water in your area safe today?</h1>
        <p className={styles.lede}>
          Residents report what they notice. A health worker checks the pattern before any warning
          goes out. <strong>Early warning from residents, not a lab test.</strong>
        </p>

        {areas === null ? (
          <section className={styles.setup}>
            <h2>Finish the Sanity setup</h2>
            <p>The app is wired up but has no project to read from yet. Run these, in order:</p>
            <ol>
              <li>
                <code>npx sanity login</code>
              </li>
              <li>
                <code>npx sanity init --env .env.local</code> — create a new project, dataset{' '}
                <code>production</code>
              </li>
              <li>
                <code>node scripts/make-seed.mjs</code>
              </li>
              <li>
                <code>npx sanity dataset import seed.ndjson production --replace</code>
              </li>
            </ol>
            <p>
              Then reload this page. The Studio lives at <Link href="/studio">/studio</Link>.
            </p>
          </section>
        ) : areas.length === 0 ? (
          <p className={styles.empty}>
            No areas yet. Import the seed data, then reload. Studio:{' '}
            <Link href="/studio">/studio</Link>
          </p>
        ) : (
          <ul className={styles.list}>
            {areas.map((area) => (
              <li key={area._id} className={styles.row}>
                <Golgappa state={area.state} size={40} />
                <div className={styles.rowText}>
                  <span className={styles.rowTitle}>
                    {area.name}
                    <span className={`${styles.chip} ${styles[area.state]}`}>
                      {STATE_LABEL[area.state]}
                    </span>
                  </span>
                  <span className={styles.reason}>{area.stateReason ?? area.city}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
