'use client'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import Link from 'next/link'
import {useMemo} from 'react'
import {Circle, MapContainer, Marker, Popup, TileLayer} from 'react-leaflet'

import {golgappaSvg} from '@/lib/glyph'
import {STATE_LABEL, type AreaState} from '@/lib/states'

import styles from './MapView.module.css'

export type MapArea = {
  _id: string
  name: string
  slug: string
  state: AreaState
  stateReason?: string
  lat: number
  lng: number
  radiusM?: number
}

const RING: Record<AreaState, string> = {
  crisp: 'var(--ok)',
  soggy: 'var(--watch)',
  phoot: 'var(--bad)',
  fresh: 'var(--fresh)',
}

export function MapView({areas, centre}: {areas: MapArea[]; centre: [number, number]}) {
  const icons = useMemo(() => {
    const cache = new Map<AreaState, L.DivIcon>()
    for (const state of ['crisp', 'soggy', 'phoot', 'fresh'] as AreaState[]) {
      cache.set(
        state,
        L.divIcon({
          html: golgappaSvg(state, 44),
          className: styles.pin,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -18],
        }),
      )
    }
    return cache
  }, [])

  return (
    <MapContainer
      center={centre}
      zoom={13}
      scrollWheelZoom
      className={styles.map}
      // The list view below the map is the keyboard and screen-reader path.
      keyboard={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {areas.map((area) => (
        <div key={area._id}>
          <Circle
            center={[area.lat, area.lng]}
            radius={area.radiusM ?? 500}
            pathOptions={{color: RING[area.state], weight: 1.5, fillOpacity: 0.08}}
          />
          <Marker position={[area.lat, area.lng]} icon={icons.get(area.state)}>
            <Popup>
              <strong>{area.name}</strong>
              <br />
              {STATE_LABEL[area.state]}
              {area.stateReason ? (
                <>
                  <br />
                  <span className={styles.reason}>{area.stateReason}</span>
                </>
              ) : null}
              <br />
              <Link href={`/area/${area.slug}`}>Open area</Link>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  )
}
