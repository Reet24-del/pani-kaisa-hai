'use client'

import Link from 'next/link'
import {useActionState, useState} from 'react'

import {decide} from '@/app/control/actions'
import type {CaseRow} from '@/app/control/page'
import {ReadingGauge} from '@/components/ReadingGauge'

import styles from './control-ui.module.css'

import {MIN_REASON} from '@/lib/caseRules'

export function CaseCard({row, canDecide}: {row: CaseRow; canDecide: boolean}) {
  const [state, action, pending] = useActionState(decide, {error: null as string | null})
  const [reason, setReason] = useState('')

  const ready = reason.trim().length >= MIN_REASON && canDecide && !pending

  return (
    <article className={styles.card}>
      <header className={styles.cardHead}>
        <div>
          <h2 className={styles.cardTitle}>
            {row.area ? (
              <Link href={`/area/${row.area.slug}`} className={styles.areaLink}>
                {row.area.name}
              </Link>
            ) : (
              'Unknown area'
            )}
          </h2>
          <p className={styles.sub}>
            {(row.reports ?? []).length} report{(row.reports ?? []).length === 1 ? '' : 's'}
            {row.openedAt ? ` · opened ${new Date(row.openedAt).toLocaleDateString('en-IN')}` : ''}
            {row.claimedBy ? ` · held by ${row.claimedBy.name}` : ''}
          </p>
          {row.status === 'testRequested' ? (
            <p className={styles.testing}>
              Lab test requested{row.claimedBy ? ` by ${row.claimedBy.name}` : ''}
              {row.decisionReason ? `: “${row.decisionReason}”` : ''}. Confirm or dismiss when the
              result is in.
            </p>
          ) : null}
        </div>
        <span className={styles.score}>
          <span className="mono">{row.riskScore}</span>
          <small>score</small>
        </span>
      </header>

      {row.scoreBreakdown ? <p className={styles.breakdown}>{row.scoreBreakdown}</p> : null}

      {row.aiSummary ? (
        <div className={styles.ai}>
          <span className={styles.aiLabel}>Written by the AI check — verify before acting</span>
          <p>{row.aiSummary}</p>
        </div>
      ) : null}

      {row.suspectedSource ? (
        <p className={styles.suspect}>
          Suspected source: <strong>{row.suspectedSource.name}</strong> ({row.suspectedSource.kind}).
          Not shown publicly until the case is confirmed.
        </p>
      ) : null}

      <details className={styles.evidence}>
        <summary>Evidence ({(row.reports ?? []).length})</summary>
        <ul className={styles.reportList}>
          {(row.reports ?? []).map((report) => (
            <li key={report._id} className={styles.reportRow}>
              <span className={`${styles.time} mono`}>
                {new Date(report.submittedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className={styles.reportBody}>
                <span>
                  {(report.waterSigns ?? []).join(', ') || 'no water signs'}
                  {report.peopleIll ? ` · ${report.peopleIll} ill` : ''} · {report.sourceKind}
                </span>
                {(report.readings ?? []).map((reading, i) =>
                  reading.parameter ? (
                    <ReadingGauge
                      key={i}
                      limit={reading.parameter}
                      value={reading.value}
                      detected={reading.detected}
                    />
                  ) : null,
                )}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <form action={action} className={styles.decision}>
        <input type="hidden" name="caseId" value={row._id} />
        <input type="hidden" name="areaSlug" value={row.area?.slug ?? ''} />
        <label htmlFor={`reason-${row._id}`} className={styles.reasonLabel}>
          Reason — goes on the public record
        </label>
        <textarea
          id={`reason-${row._id}`}
          name="reason"
          rows={2}
          className={styles.textarea}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="What did you check, and what did you find?"
        />

        {!canDecide ? (
          <p className={styles.hint}>Choose who you are at the top before deciding.</p>
        ) : reason.trim().length < MIN_REASON ? (
          <p className={styles.hint}>
            {MIN_REASON - reason.trim().length} more characters before you can decide.
          </p>
        ) : null}

        {state.error ? <p className={styles.error}>{state.error}</p> : null}

        <div className={styles.buttons}>
          <button
            type="submit"
            name="decision"
            value="confirm"
            className={styles.danger}
            disabled={!ready}
          >
            {pending ? 'Saving…' : 'Confirm contamination'}
          </button>
          <button
            type="submit"
            name="decision"
            value="dismiss"
            className={styles.secondary}
            disabled={!ready}
          >
            Dismiss
          </button>
          {row.status !== 'testRequested' ? (
            <button
              type="submit"
              name="decision"
              value="requestTest"
              className={styles.secondary}
              disabled={!ready}
            >
              Ask for a test
            </button>
          ) : null}
        </div>
      </form>
    </article>
  )
}
