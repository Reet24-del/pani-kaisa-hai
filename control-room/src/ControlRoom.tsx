import {createDocument, createDocumentHandle, editDocument} from '@sanity/sdk'
import {useApplyDocumentActions, useCurrentUser, useQuery} from '@sanity/sdk-react'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Inline,
  Stack,
  Text,
  TextArea,
} from '@sanity/ui'
import {useState} from 'react'

const MIN_REASON = 10

const QUEUE = /* groq */ `{
  "needsVerification": *[_type == "waterCase" && status in ["needsVerification", "testRequested"]]
    | order(status asc, riskScore desc, openedAt asc){
      _id, status, riskScore, scoreBreakdown, aiSummary, openedAt, decisionReason,
      "areaId": area._ref,
      "areaName": area->name,
      "areaHasAlert": count(*[_type == "alert" && area._ref == ^.area._ref && !defined(resolvedAt)]) > 0,
      "reports": reports[]->{
        _id, submittedAt, waterSigns, sourceKind,
        "peopleIll": illness.people,
        "readings": readings[]{value, detected, "parameter": parameter->{parameter, unit, rule}}
      }
    },
  "watch": *[_type == "waterCase" && status == "watch"] | order(riskScore desc)[0...8]{
    _id, riskScore, scoreBreakdown, "areaName": area->name
  },
  "alerts": *[_type == "alert" && !defined(resolvedAt)] | order(issuedAt desc){
    _id, issuedAt, "areaName": area->name, "verifiedBy": verifiedBy->name
  },
  "me": *[_type == "contact" && canVerify == true && email == $email][0]{_id, name}
}`

type Reading = {
  value?: number
  detected?: boolean
  parameter?: {parameter: string; unit?: string; rule: string}
}

type Report = {
  _id: string
  submittedAt: string
  waterSigns?: string[]
  sourceKind?: string
  peopleIll?: number
  readings?: Reading[]
}

type Case = {
  _id: string
  status: 'needsVerification' | 'testRequested'
  decisionReason?: string
  areaHasAlert?: boolean
  riskScore: number
  scoreBreakdown?: string
  aiSummary?: string
  openedAt?: string
  areaId: string
  areaName?: string
  reports?: Report[]
}

type QueueData = {
  needsVerification: Case[]
  watch: {_id: string; riskScore: number; scoreBreakdown?: string; areaName?: string}[]
  alerts: {_id: string; issuedAt: string; areaName?: string; verifiedBy?: string}[]
  me: {_id: string; name: string} | null
}

export function ControlRoom() {
  const user = useCurrentUser()
  const {data, isPending} = useQuery<QueueData>({
    query: QUEUE,
    params: {email: user?.email ?? ''},
  })

  const cases = data?.needsVerification ?? []
  const verifier = data?.me ?? null

  return (
    <Card height="fill" padding={4} tone="transparent">
      <Stack space={5}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Heading size={3}>Waiting on a person ({cases.length})</Heading>
          <Text size={1} muted>
            {verifier
              ? `Signed in as ${verifier.name}`
              : `${user?.email ?? 'You'} is not listed as a verifier — read only`}
          </Text>
        </Flex>

        {isPending && cases.length === 0 ? <Text muted>Loading the queue…</Text> : null}

        {!isPending && cases.length === 0 ? (
          <Card padding={4} radius={3} tone="transparent" border>
            <Text muted>Nothing to verify right now.</Text>
          </Card>
        ) : null}

        <Stack space={4}>
          {cases.map((row) => (
            <CaseCard key={row._id} row={row} verifier={verifier} />
          ))}
        </Stack>

        <Grid columns={[1, 1, 2]} gap={4}>
          <Card padding={4} radius={3} border tone="transparent">
            <Stack space={3}>
              <Heading size={1}>Watch ({data?.watch.length ?? 0})</Heading>
              <Text size={1} muted>
                Already soggy on the map. No person needed yet.
              </Text>
              {(data?.watch ?? []).map((c) => (
                <Text key={c._id} size={1}>
                  <strong>{c.areaName}</strong> — {c.riskScore} · {c.scoreBreakdown}
                </Text>
              ))}
            </Stack>
          </Card>

          <Card padding={4} radius={3} border tone="transparent">
            <Stack space={3}>
              <Heading size={1}>Active alerts ({data?.alerts.length ?? 0})</Heading>
              {(data?.alerts ?? []).map((a) => (
                <Text key={a._id} size={1}>
                  <strong>{a.areaName}</strong> — confirmed by {a.verifiedBy ?? 'unknown'}
                </Text>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Stack>
    </Card>
  )
}

function CaseCard({row, verifier}: {row: Case; verifier: {_id: string; name: string} | null}) {
  const apply = useApplyDocumentActions()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = Boolean(verifier) && reason.trim().length >= MIN_REASON && !busy

  async function decide(decision: 'confirm' | 'dismiss' | 'requestTest') {
    if (!verifier) return
    setBusy(true)
    setError(null)

    // liveEdit: these documents are written by the API and never drafted, so
    // edits must land on the published document. Without it the SDK writes a
    // draft, and the public site would never see the decision.
    const caseHandle = createDocumentHandle({
      documentId: row._id,
      documentType: 'waterCase',
      liveEdit: true,
    })
    const areaHandle = createDocumentHandle({
      documentId: row.areaId,
      documentType: 'area',
      liveEdit: true,
    })
    const now = new Date().toISOString()
    const decided = {
      decisionReason: reason.trim(),
      claimedBy: {_type: 'reference', _ref: verifier._id},
      claimedAt: now,
    }

    try {
      if (decision === 'confirm') {
        // One transaction: the decision, the alert it produces (with the
        // person who signed it and their reason) and the area turning red.
        await apply([
          editDocument(caseHandle, {set: {status: 'confirmed', ...decided}}),
          createDocument(
            {documentType: 'alert', documentId: `alert-${row._id}`, liveEdit: true},
            {
              area: {_type: 'reference', _ref: row.areaId},
              waterCase: {_type: 'reference', _ref: row._id},
              severity: 'doNotDrink',
              precautionsEn:
                'Do not drink tap water. Use boiled or packaged water for drinking and cooking until this is cleared.',
              precautionsHi:
                'नल का पानी न पिएँ। जब तक सूचना न मिले, पीने और खाना बनाने के लिए उबला या पैकेज्ड पानी लें।',
              issuedAt: now,
              verifiedBy: {_type: 'reference', _ref: verifier._id},
              reason: reason.trim(),
            },
          ),
          editDocument(areaHandle, {
            set: {
              state: 'phoot',
              stateReason: 'Contamination confirmed by a health worker.',
              stateChangedAt: now,
            },
          }),
        ])
      } else if (decision === 'requestTest') {
        await apply([
          editDocument(caseHandle, {set: {status: 'testRequested', ...decided}}),
          editDocument(areaHandle, {
            set: {
              stateReason:
                'A health worker has asked for a lab test. Boil or filter until the result is in.',
            },
          }),
        ])
      } else {
        // Dismissed. If the area has no live alert, it goes back to crisp; the
        // daily reconcile in the web app re-derives it from everything else.
        await apply([
          editDocument(caseHandle, {set: {status: 'dismissed', ...decided}}),
          ...(row.areaHasAlert
            ? []
            : [
                editDocument(areaHandle, {
                  set: {
                    state: 'crisp',
                    stateReason: 'A health worker checked the reports and found no contamination.',
                    stateChangedAt: now,
                  },
                }),
              ]),
        ])
      }
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the decision.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card padding={4} radius={3} border tone="critical">
      <Stack space={4}>
        <Flex align="flex-start" justify="space-between" gap={3}>
          <Stack space={2}>
            <Heading size={2}>{row.areaName ?? 'Unknown area'}</Heading>
            <Text size={1} muted>
              {(row.reports ?? []).length} report{(row.reports ?? []).length === 1 ? '' : 's'}
              {row.openedAt ? ` · opened ${new Date(row.openedAt).toLocaleDateString('en-IN')}` : ''}
            </Text>
          </Stack>
          <Badge tone="critical" fontSize={2} padding={3}>
            {row.riskScore}
          </Badge>
        </Flex>

        {row.status === 'testRequested' ? (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>
              Lab test requested{row.decisionReason ? `: “${row.decisionReason}”` : ''}. Confirm or
              dismiss when the result is in.
            </Text>
          </Card>
        ) : null}

        {row.scoreBreakdown ? <Text size={1}>{row.scoreBreakdown}</Text> : null}

        {row.aiSummary ? (
          <Card padding={3} radius={2} tone="primary">
            <Stack space={2}>
              <Text size={0} weight="semibold">
                WRITTEN BY THE AI CHECK — VERIFY BEFORE ACTING
              </Text>
              <Text size={1}>{row.aiSummary}</Text>
            </Stack>
          </Card>
        ) : null}

        <Stack space={2}>
          {(row.reports ?? []).map((report) => (
            <Text key={report._id} size={1} muted>
              {new Date(report.submittedAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              — {(report.waterSigns ?? []).join(', ') || 'no water signs'}
              {report.peopleIll ? ` · ${report.peopleIll} ill` : ''}
              {(report.readings ?? [])
                .map(
                  (reading) =>
                    ` · ${reading.parameter?.parameter ?? 'reading'} ${
                      reading.value ?? (reading.detected ? 'detected' : 'not detected')
                    }${reading.parameter?.unit ? ` ${reading.parameter.unit}` : ''}`,
                )
                .join('')}
            </Text>
          ))}
        </Stack>

        <Stack space={3}>
          <Text size={1} weight="semibold">
            Reason — goes on the public record
          </Text>
          <TextArea
            rows={2}
            value={reason}
            placeholder="What did you check, and what did you find?"
            onChange={(event) => setReason(event.currentTarget.value)}
          />
          {!verifier ? (
            <Text size={1} muted>
              Your Sanity account is not listed as a verifier, so you can read but not decide.
            </Text>
          ) : reason.trim().length < MIN_REASON ? (
            <Text size={1} muted>
              {MIN_REASON - reason.trim().length} more characters before you can decide.
            </Text>
          ) : null}
          {error ? (
            <Text size={1} style={{color: 'var(--card-critical-fg-color)'}}>
              {error}
            </Text>
          ) : null}

          <Inline space={2}>
            <Button
              tone="critical"
              text="Confirm contamination"
              disabled={!ready}
              onClick={() => decide('confirm')}
            />
            <Button mode="ghost" text="Dismiss" disabled={!ready} onClick={() => decide('dismiss')} />
            {row.status !== 'testRequested' ? (
              <Button
                mode="ghost"
                text="Ask for a test"
                disabled={!ready}
                onClick={() => decide('requestTest')}
              />
            ) : null}
          </Inline>
        </Stack>

        <Box>
          <Text size={0} muted>
            Confirming turns the area red for residents straight away, with your name and reason.
            The municipal email goes out from the web control room only, where the server holds
            the mail key.
          </Text>
        </Box>
      </Stack>
    </Card>
  )
}
