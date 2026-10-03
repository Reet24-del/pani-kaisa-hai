import 'server-only'

import Anthropic from '@anthropic-ai/sdk'

import type {ReportLike} from './risk'

/**
 * The AI check writes the case summary a verifier reads first.
 *
 * It is allowed to describe and to score. It is never allowed to decide — the
 * confirm and dismiss transitions live in sanity/lib/cases.ts behind a verifier
 * check. Everything this function returns is labelled as AI-written wherever it
 * is shown.
 *
 * Without an API key it still produces a usable summary from the numbers, so
 * the app runs offline and in a demo with no credit spend.
 */
export async function summariseCase(input: {
  areaName: string
  reports: ReportLike[]
  breakdown: string
  bacteria: boolean
}): Promise<string> {
  const fallback = plainSummary(input)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallback

  try {
    const client = new Anthropic({apiKey})
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
      max_tokens: 1000,
      output_config: {effort: 'low'},
      system:
        'You brief a community health worker in India on possible drinking-water contamination. ' +
        'Three sentences maximum, plain English, no jargon and no emoji. ' +
        'Say what the reports have in common, what the readings show, and what is still unknown. ' +
        'Never tell the worker what to decide, and never claim contamination is confirmed.',
      messages: [
        {
          role: 'user',
          content: [
            `Area: ${input.areaName}`,
            `Score: ${input.breakdown}`,
            input.bacteria ? 'A bacteria test came back positive.' : '',
            '',
            'Reports:',
            ...input.reports.map((r) => {
              const signs = (r.waterSigns ?? []).join(', ') || 'no water signs'
              const ill = r.illness?.people ? `, ${r.illness.people} people ill` : ''
              const readings = (r.readings ?? [])
                .map(
                  (reading) =>
                    `${reading.parameter?.parameter ?? 'reading'} ${
                      reading.value ?? (reading.detected ? 'detected' : 'not detected')
                    }`,
                )
                .join('; ')
              return `- ${r.submittedAt}: ${signs}${ill}${readings ? `, ${readings}` : ''}`
            }),
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    })

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    return text || fallback
  } catch (error) {
    // A summary is a convenience. Losing it must never stop a case from
    // reaching a verifier.
    console.error('[ai] summary failed, using the plain one:', error)
    return fallback
  }
}

function plainSummary({areaName, reports, breakdown, bacteria}: {
  areaName: string
  reports: ReportLike[]
  breakdown: string
  bacteria: boolean
}): string {
  const people = reports.reduce((sum, r) => sum + (r.illness?.people ?? 0), 0)
  const signs = new Set<string>()
  for (const r of reports) for (const s of r.waterSigns ?? []) signs.add(s)

  const parts = [
    `${reports.length} report${reports.length === 1 ? '' : 's'} from ${areaName}`,
    signs.size ? `mentioning ${[...signs].join(', ')}` : null,
    people ? `with ${people} people reported ill` : null,
  ].filter(Boolean)

  return [
    `${parts.join(', ')}.`,
    `Score: ${breakdown}.`,
    bacteria ? 'A bacteria test was positive, so this needs a person to look at it.' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
