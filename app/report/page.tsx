import {ReportForm, type LimitOption} from '@/components/ReportForm'
import {Disclaimer, SiteHeader} from '@/components/SiteHeader'
import type {PlaceableArea} from '@/lib/geo'
import {fetchSanity, sanityConfigured} from '@/sanity/lib/fetch'

import styles from './report.module.css'

export const dynamic = 'force-dynamic'

const AREAS = `*[_type == "area"]|order(name asc){
  _id, name, "slug": slug.current, "lat": centre.lat, "lng": centre.lng, radiusM
}`

const LIMITS = `*[_type == "safetyLimit"]|order(parameter asc){_id, parameter, code, unit, rule}`

export default async function ReportPage({searchParams}: PageProps<'/report'>) {
  const {area} = await searchParams

  if (!sanityConfigured) {
    return (
      <div className={styles.page}>
        <SiteHeader back={{href: '/', label: 'Map'}} />
        <main className={styles.main}>
          <p>Sanity isn’t set up yet, so reports can’t be saved. See the steps on the home page.</p>
        </main>
      </div>
    )
  }

  const [areas, limits] = await Promise.all([
    fetchSanity<PlaceableArea[]>(AREAS),
    fetchSanity<LimitOption[]>(LIMITS),
  ])

  return (
    <div className={styles.page}>
      <SiteHeader back={{href: '/', label: 'Map'}} />
      <main className={styles.main}>
        <ReportForm
          areas={areas ?? []}
          limits={limits ?? []}
          initialAreaSlug={typeof area === 'string' ? area : undefined}
        />
        <Disclaimer />
      </main>
    </div>
  )
}
