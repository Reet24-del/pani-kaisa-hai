'use client'

import styles from './ReadingGauge.module.css'

export type GaugeLimit = {
  parameter: string
  unit?: string
  rule: string
  acceptableMin?: number
  acceptableMax?: number
  permissibleMax?: number
}

/**
 * A reading on a bar, with the acceptable band in green and the permissible
 * band in amber. Used in the control room and by the Studio input, so a number
 * is never shown without the limit it is judged against.
 */
export function ReadingGauge({
  limit,
  value,
  detected,
}: {
  limit: GaugeLimit
  value?: number
  detected?: boolean
}) {
  if (limit.rule === 'absent') {
    const bad = detected === true
    return (
      <div className={styles.row}>
        <span className={styles.name}>{limit.parameter}</span>
        <span className={bad ? styles.verdictBad : styles.verdictOk}>
          {detected === undefined ? 'not tested' : bad ? 'detected' : 'not detected'}
        </span>
      </div>
    )
  }

  if (typeof value !== 'number') {
    return (
      <div className={styles.row}>
        <span className={styles.name}>{limit.parameter}</span>
        <span className={styles.verdictUnknown}>not tested</span>
      </div>
    )
  }

  const lo = limit.acceptableMin ?? 0
  const hi = limit.acceptableMax ?? limit.acceptableMin ?? 0
  const outer = Math.max(limit.permissibleMax ?? hi * 1.6, hi * 1.6, value * 1.15, 1)

  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / outer) * 100))}%`

  const okStart = limit.rule === 'min' ? lo : 0
  const okEnd = limit.rule === 'min' ? outer : hi
  const warnEnd = limit.permissibleMax ?? okEnd

  const verdict =
    limit.rule === 'min'
      ? value >= lo
        ? 'ok'
        : 'bad'
      : limit.rule === 'range'
        ? value >= lo && value <= hi
          ? 'ok'
          : 'bad'
        : value <= hi
          ? 'ok'
          : value <= (limit.permissibleMax ?? hi)
            ? 'warn'
            : 'bad'

  return (
    <div className={styles.block}>
      <div className={styles.row}>
        <span className={styles.name}>{limit.parameter}</span>
        <span
          className={
            verdict === 'ok' ? styles.verdictOk : verdict === 'warn' ? styles.verdictWarn : styles.verdictBad
          }
        >
          <span className="mono">{value}</span>
          {limit.unit ? ` ${limit.unit}` : ''}
        </span>
      </div>
      <div className={styles.bar}>
        <span
          className={styles.ok}
          style={{left: pct(okStart), width: `calc(${pct(okEnd)} - ${pct(okStart)})`}}
        />
        {warnEnd > okEnd ? (
          <span
            className={styles.warn}
            style={{left: pct(okEnd), width: `calc(${pct(warnEnd)} - ${pct(okEnd)})`}}
          />
        ) : null}
        <span className={styles.marker} style={{left: pct(value)}} />
      </div>
      <p className={styles.scale}>
        {limit.rule === 'min'
          ? `must stay above ${lo}${limit.unit ? ` ${limit.unit}` : ''}`
          : limit.rule === 'range'
            ? `acceptable ${lo}–${hi}`
            : `acceptable up to ${hi}${
                limit.permissibleMax ? `, permissible up to ${limit.permissibleMax}` : ''
              }`}
      </p>
    </div>
  )
}
