import {defineField, defineType} from 'sanity'

/**
 * The tunable thresholds behind the risk score. One document.
 *
 * These weights are assumptions, not medical guidance, so they live in the
 * dataset where they can be corrected by someone who knows better than the code.
 */
export const riskSettingsType = defineType({
  name: 'riskSettings',
  title: 'Risk settings',
  type: 'document',
  fields: [
    defineField({
      name: 'windowHours',
      title: 'Scoring window (hours)',
      type: 'number',
      initialValue: 72,
      validation: (rule) => rule.required().min(6).max(336),
    }),
    defineField({
      name: 'watchAt',
      title: 'Soggy at score',
      type: 'number',
      initialValue: 3,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'verifyAt',
      title: 'Needs verification at score',
      type: 'number',
      initialValue: 6,
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: 'quietDays',
      title: 'Quiet days before recovery',
      type: 'number',
      initialValue: 5,
      validation: (rule) => rule.required().min(1).max(30),
    }),
    defineField({
      name: 'rainMm',
      title: 'Heavy rain threshold (mm in 48 h)',
      type: 'number',
      initialValue: 40,
    }),
    defineField({
      name: 'points',
      title: 'Points per signal',
      type: 'object',
      options: {columns: 2},
      fields: [
        defineField({name: 'report', title: 'Report from a new device', type: 'number', initialValue: 1}),
        defineField({name: 'illHousehold', title: 'Household reporting illness', type: 'number', initialValue: 2}),
        defineField({name: 'overAcceptable', title: 'Reading over acceptable limit', type: 'number', initialValue: 2}),
        defineField({name: 'overPermissible', title: 'Reading over permissible limit', type: 'number', initialValue: 3}),
        defineField({name: 'heavyRain', title: 'Heavy rain in last 48 h', type: 'number', initialValue: 1}),
      ],
    }),
  ],
  preview: {
    select: {watch: 'watchAt', verify: 'verifyAt'},
    prepare({watch, verify}) {
      return {title: 'Risk settings', subtitle: `soggy at ${watch} · verify at ${verify}`}
    },
  },
})
