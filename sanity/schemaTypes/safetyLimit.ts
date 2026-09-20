import {defineField, defineType} from 'sanity'

/**
 * One drinking-water rule from IS 10500.
 *
 * Limits are content, not code: the AI check reads them with GROQ, so a
 * threshold can be corrected in the Studio without a deploy, and every limit
 * carries the clause it came from.
 */
export const safetyLimitType = defineType({
  name: 'safetyLimit',
  title: 'Safety limit',
  type: 'document',
  fields: [
    defineField({
      name: 'parameter',
      title: 'Parameter',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'code',
      type: 'string',
      description: 'Short key used in code and in report readings.',
      options: {
        list: ['ph', 'tds', 'turbidity', 'chlorine', 'ecoli', 'coliform'],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'unit',
      type: 'string',
      description: 'mg/L, NTU, or blank for pH and bacteria.',
    }),
    defineField({
      name: 'rule',
      type: 'string',
      description: 'How a reading is judged against this limit.',
      options: {
        list: [
          {title: 'Must stay below the limit', value: 'max'},
          {title: 'Must stay above the limit', value: 'min'},
          {title: 'Must stay inside a range', value: 'range'},
          {title: 'Must not be detected at all', value: 'absent'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'acceptableMin',
      title: 'Acceptable minimum',
      type: 'number',
    }),
    defineField({
      name: 'acceptableMax',
      title: 'Acceptable maximum',
      type: 'number',
    }),
    defineField({
      name: 'permissibleMax',
      title: 'Permissible maximum (no other source available)',
      type: 'number',
    }),
    defineField({
      name: 'healthNote',
      title: 'What it means for health',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'citation',
      type: 'string',
      description: 'Where this value comes from, e.g. "IS 10500:2012, Table 1".',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'parameter',
      unit: 'unit',
      min: 'acceptableMin',
      max: 'acceptableMax',
      rule: 'rule',
    },
    prepare({title, unit, min, max, rule}) {
      const band =
        rule === 'absent'
          ? 'not detectable'
          : rule === 'range'
            ? `${min}–${max}`
            : rule === 'min'
              ? `min ${min}`
              : `max ${max}`
      return {title, subtitle: `${band}${unit ? ` ${unit}` : ''}`}
    },
  },
})
