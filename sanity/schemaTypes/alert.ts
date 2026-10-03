import {defineField, defineType} from 'sanity'

/**
 * A confirmed warning: the decision, kept apart from the evidence.
 *
 * An alert always points back at the case it came from, so a reader can see
 * which reports and readings it rested on and who signed it off.
 */
export const alertType = defineType({
  name: 'alert',
  title: 'Alert',
  type: 'document',
  fields: [
    defineField({
      name: 'area',
      type: 'reference',
      to: [{type: 'area'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'waterCase',
      title: 'Case',
      type: 'reference',
      to: [{type: 'waterCase'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'severity',
      type: 'string',
      initialValue: 'doNotDrink',
      options: {
        list: [
          {title: 'Advisory — boil before drinking', value: 'advisory'},
          {title: 'Do not drink tap water', value: 'doNotDrink'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'precautionsEn',
      title: 'What to do (English)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'precautionsHi',
      title: 'What to do (Hindi)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'issuedAt',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'verifiedBy',
      title: 'Verified by',
      type: 'reference',
      to: [{type: 'contact'}],
      description: 'No alert exists without a named human.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reason',
      title: 'Why it was confirmed',
      type: 'text',
      rows: 3,
      description: 'Written by the verifier, shown on the public area page next to their name.',
      validation: (rule) => rule.required().min(10),
    }),
    defineField({name: 'notifiedAt', title: 'Municipality notified at', type: 'datetime'}),
    defineField({name: 'resolvedAt', type: 'datetime'}),
    defineField({
      name: 'resolvedBy',
      title: 'Marked fixed by',
      type: 'reference',
      to: [{type: 'contact'}],
      hidden: ({document}) => !document?.resolvedAt,
    }),
    defineField({name: 'resolutionNote', type: 'text', rows: 2}),
  ],
  preview: {
    select: {area: 'area.name', severity: 'severity', issued: 'issuedAt', resolved: 'resolvedAt'},
    prepare({area, severity, issued, resolved}) {
      const when = issued ? new Date(issued).toLocaleDateString('en-IN') : ''
      return {
        title: `${area ?? 'Area'} — ${severity === 'advisory' ? 'Boil first' : 'Do not drink'}`,
        subtitle: resolved ? `resolved · issued ${when}` : `active · issued ${when}`,
      }
    },
  },
})
