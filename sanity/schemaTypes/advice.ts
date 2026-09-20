import {defineField, defineType} from 'sanity'

/** What a resident should do in each golgappa state. Content, so it can be reworded without a deploy. */
export const adviceType = defineType({
  name: 'advice',
  title: 'Advice',
  type: 'document',
  fields: [
    defineField({
      name: 'state',
      title: 'Golgappa state',
      type: 'string',
      options: {
        list: [
          {title: 'Crisp', value: 'crisp'},
          {title: 'Soggy', value: 'soggy'},
          {title: 'Phoot gaya', value: 'phoot'},
          {title: 'Fresh batch', value: 'fresh'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'headlineEn',
      title: 'Headline (English)',
      type: 'string',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'headlineHi',
      title: 'Headline (Hindi)',
      type: 'string',
    }),
    defineField({
      name: 'textEn',
      title: 'What to do (English)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'textHi',
      title: 'What to do (Hindi)',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {title: 'headlineEn', state: 'state'},
    prepare({title, state}) {
      return {title, subtitle: state}
    },
  },
})
