'use client'

import {useEffect, useState} from 'react'
import {type ObjectInputProps, useClient} from 'sanity'

import {ReadingGauge, type GaugeLimit} from '@/components/ReadingGauge'

import {apiVersion} from '../env'

type ReadingValue = {
  parameter?: {_ref?: string}
  value?: number
  detected?: boolean
}

/**
 * Studio input for a test reading.
 *
 * A number on its own means nothing to an editor — 780 is fine for one
 * parameter and alarming for another. This draws the reading against the limit
 * it is judged by, using the same component the control room uses, so the
 * Studio and the verifier see the same thing.
 */
export function ReadingInput(props: ObjectInputProps) {
  const client = useClient({apiVersion})
  const value = props.value as ReadingValue | undefined
  const ref = value?.parameter?._ref
  // Remember which parameter the loaded limit belongs to, so a cleared or
  // changed parameter never shows a stale gauge.
  const [loaded, setLoaded] = useState<{ref: string; limit: GaugeLimit | null} | null>(null)
  const limit = ref && loaded?.ref === ref ? loaded.limit : null

  useEffect(() => {
    if (!ref) return
    let cancelled = false
    client
      .fetch<GaugeLimit | null>(
        `*[_id == $id][0]{parameter, unit, rule, acceptableMin, acceptableMax, permissibleMax}`,
        {id: ref},
      )
      .then((result) => {
        if (!cancelled) setLoaded({ref, limit: result})
      })
      .catch(() => {
        if (!cancelled) setLoaded({ref, limit: null})
      })
    return () => {
      cancelled = true
    }
  }, [client, ref])

  return (
    <div>
      {limit ? (
        <div style={{marginBottom: 12}}>
          <ReadingGauge limit={limit} value={value?.value} detected={value?.detected} />
        </div>
      ) : null}
      {props.renderDefault(props)}
    </div>
  )
}
