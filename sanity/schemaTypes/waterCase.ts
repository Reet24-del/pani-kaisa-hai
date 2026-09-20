import {defineField, defineType} from 'sanity'

/**
 * Related reports in one area, moving through verification.
 *
 * The case is the workflow subject: it links evidence (reports) to a decision
 * (confirm or dismiss) without ever turning one into the other. An AI check can
 * move a case as far as "needs verification"; only a human can confirm or
 * dismiss it.
 */
export const waterCaseType = defineType({
  name: 'waterCase',
  title: 'Case',
  type: 'document',
  fields: [
    defineField({
      name: 'area',
      type: 'reference',
      to: [{type: 'area'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'logged',
      options: {
        list: [
          {title: 'Logged (score 0–2)', value: 'logged'},
          {title: 'Watch (score 3–5)', value: 'watch'},
          {title: 'Needs verification', value: 'needsVerification'},
          {title: 'Confirmed', value: 'confirmed'},
          {title: 'Dismissed', value: 'dismissed'},
          {title: 'Test requested', value: 'testRequested'},
          {title: 'Resolved', value: 'resolved'},
          {title: 'Closed', value: 'closed'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reports',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'report'}]}],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'riskScore',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'scoreBreakdown',
      title: 'Score breakdown',
      type: 'text',
      rows: 3,
      description: 'Plain-language sum, e.g. "3 reports (+3), 1 household ill (+2), TDS 780 (+2)".',
    }),
    defineField({
      name: 'aiSummary',
      title: 'AI summary',
      type: 'text',
      rows: 4,
      description: 'Written by the AI check. Always shown to verifiers as AI-written.',
    }),
    defineField({
      name: 'suspectedSource',
      type: 'reference',
      to: [{type: 'waterSource'}],
      description: 'Visible to verifiers only until the case is confirmed.',
    }),
    defineField({
      name: 'claimedBy',
      type: 'reference',
      to: [{type: 'contact'}],
    }),
    defineField({name: 'claimedAt', type: 'datetime'}),
    defineField({
      name: 'decisionReason',
      title: 'Decision reason',
      type: 'text',
      rows: 2,
      description: 'Required before a case can be confirmed or dismissed.',
    }),
    defineField({name: 'openedAt', type: 'datetime'}),
    defineField({
      name: 'lastSignalAt',
      title: 'Last signal at',
      type: 'datetime',
      description: 'Used by the scheduled tick for the 72-hour and 5-day timers.',
    }),
  ],
  orderings: [
    {title: 'Highest risk', name: 'riskDesc', by: [{field: 'riskScore', direction: 'desc'}]},
    {title: 'Newest', name: 'openedDesc', by: [{field: 'openedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {area: 'area.name', status: 'status', score: 'riskScore', reports: 'reports'},
    prepare({area, status, score, reports}) {
      const count = Array.isArray(reports) ? reports.length : 0
      return {
        title: `${area ?? 'Unknown area'} — score ${score ?? 0}`,
        subtitle: `${status} · ${count} report${count === 1 ? '' : 's'}`,
      }
    },
  },
})
