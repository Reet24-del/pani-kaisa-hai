import {defineArrayMember, defineField, defineType} from 'sanity'

import {ReadingInput} from '../components/ReadingInput'

/**
 * One resident's observation. Evidence, never a decision.
 *
 * Reports are append-only: a correction is a new report, never an edit, so the
 * evidence behind an alert stays exactly as it was when the verifier saw it.
 */
export const reportType = defineType({
  name: 'report',
  title: 'Report',
  type: 'document',
  fields: [
    defineField({
      name: 'area',
      type: 'reference',
      to: [{type: 'area'}],
      description: 'Empty means the report landed outside every mapped area.',
    }),
    defineField({
      name: 'location',
      type: 'geopoint',
      description: 'Never shown publicly. Public pins snap to the area centre.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourceKind',
      title: 'Water source',
      type: 'string',
      options: {
        list: [
          {title: 'Tap (municipal)', value: 'pipeline'},
          {title: 'Borewell', value: 'borewell'},
          {title: 'Tanker', value: 'tanker'},
          {title: 'RO plant', value: 'ro'},
          {title: 'Not sure', value: 'unknown'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'waterSigns',
      title: 'What they noticed',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Smell', value: 'smell'},
          {title: 'Colour', value: 'colour'},
          {title: 'Taste', value: 'taste'},
          {title: 'Particles', value: 'particles'},
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'illness',
      title: 'Illness at home',
      type: 'object',
      fields: [
        defineField({name: 'households', type: 'number', initialValue: 0}),
        defineField({name: 'people', title: 'People affected', type: 'number', initialValue: 0}),
        defineField({
          name: 'symptoms',
          type: 'array',
          of: [{type: 'string'}],
          options: {
            list: ['diarrhoea', 'vomiting', 'fever', 'jaundice'],
            layout: 'grid',
          },
        }),
      ],
      options: {collapsible: true, collapsed: true},
    }),
    defineField({
      name: 'readings',
      title: 'Test readings',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'reading',
          components: {input: ReadingInput},
          fields: [
            defineField({
              name: 'parameter',
              type: 'reference',
              to: [{type: 'safetyLimit'}],
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'value', type: 'number'}),
            defineField({
              name: 'detected',
              title: 'Detected',
              type: 'boolean',
              description: 'For bacteria strips: was anything detected?',
            }),
            defineField({
              name: 'method',
              type: 'string',
              options: {list: ['strip', 'meter', 'lab'], layout: 'radio'},
              initialValue: 'strip',
            }),
          ],
          preview: {
            select: {p: 'parameter.parameter', v: 'value', d: 'detected', m: 'method'},
            prepare({p, v, d, m}) {
              const value = v ?? (d === true ? 'detected' : d === false ? 'not detected' : '—')
              return {title: `${p ?? 'Reading'}: ${value}`, subtitle: m}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'photo',
      type: 'image',
      options: {hotspot: false},
    }),
    defineField({
      name: 'submittedAt',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'deviceHash',
      title: 'Device hash',
      type: 'string',
      description: 'Hashed device id for rate limiting and for counting unique reporters. No IP addresses are stored.',
      readOnly: true,
    }),
    defineField({
      name: 'contact',
      title: 'Contact (private)',
      type: 'object',
      description: 'Optional, never rendered on a public page.',
      fields: [
        defineField({name: 'phone', type: 'string'}),
        defineField({name: 'email', type: 'string'}),
      ],
      options: {collapsible: true, collapsed: true},
    }),
    defineField({
      name: 'duplicateOf',
      title: 'Suspected duplicate of',
      type: 'reference',
      to: [{type: 'report'}],
      description: 'Set by the AI check. Duplicates do not add to the risk score.',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      area: 'area.name',
      signs: 'waterSigns',
      people: 'illness.people',
      at: 'submittedAt',
    },
    prepare({area, signs, people, at}) {
      const what = Array.isArray(signs) && signs.length ? signs.join(', ') : 'no water signs'
      const sick = people ? ` · ${people} sick` : ''
      const when = at ? new Date(at).toLocaleString('en-IN') : ''
      return {title: `${area ?? 'Unmapped'} — ${what}${sick}`, subtitle: when}
    },
  },
})
