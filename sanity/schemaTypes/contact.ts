import {defineField, defineType} from 'sanity'

/** A verifier or a municipal officer. */
export const contactType = defineType({
  name: 'contact',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      options: {
        list: [
          {title: 'ASHA worker', value: 'asha'},
          {title: 'RWA volunteer', value: 'rwa'},
          {title: 'Health official', value: 'health'},
          {title: 'Municipal officer', value: 'municipal'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({name: 'phone', type: 'string'}),
    defineField({
      name: 'areas',
      title: 'Areas covered',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'area'}]}],
    }),
    defineField({
      name: 'canVerify',
      title: 'Can confirm or dismiss cases',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'name', role: 'role', canVerify: 'canVerify'},
    prepare({title, role, canVerify}) {
      return {title, subtitle: canVerify ? `${role} · verifier` : role}
    },
  },
})
