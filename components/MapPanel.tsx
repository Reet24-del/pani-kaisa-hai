'use client'

import dynamic from 'next/dynamic'

import type {MapArea} from './MapView'
import styles from './MapPanel.module.css'

// Leaflet touches `window` on import, so the map only loads in the browser.
const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading map…</div>,
})

export function MapPanel({areas, centre}: {areas: MapArea[]; centre: [number, number]}) {
  return (
    <div className={styles.wrap}>
      <MapView areas={areas} centre={centre} />
    </div>
  )
}
