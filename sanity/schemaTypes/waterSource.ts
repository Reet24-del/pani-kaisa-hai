import {defineField, defineType} from 'sanity'

/**
 * Where an area's water comes from.
 *
 * The source → areas relationship is stored once, here. An area finds its
 * sources with a reverse `references($id)` query. That single relationship is
 * what makes source tracing possible: if several areas fed by one pipeline turn
 * soggy at the same time, the pipeline is the suspect.
 */
export const waterSourceType = defineType({
  name: 'waterSource',
  title: 'Water source',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          {title: 'Municipal pipeline', value: 'pipeline'},
          {title: 'Borewell', value: 'borewell'},
          {title: 'Tanker', value: 'tanker'},
          {title: 'RO plant', value: 'ro'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'operator',
      type: 'string',
      description: 'Municipal body, private operator, or the society that runs it.',
    }),
    defineField({
      name: 'areasServed',
      title: 'Areas served',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'area'}]}],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    select: {title: 'name', kind: 'kind', areas: 'areasServed'},
    prepare({title, kind, areas}) {
      const count = Array.isArray(areas) ? areas.length : 0
      return {title, subtitle: `${kind} · serves ${count} area${count === 1 ? '' : 's'}`}
    },
  },
})
