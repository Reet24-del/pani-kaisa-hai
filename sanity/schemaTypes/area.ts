import {defineField, defineType} from 'sanity'

/**
 * A neighbourhood. One golgappa on the map.
 *
 * `state` is derived from its cases (see the risk score in the PRD) but stored
 * here with a reason and a timestamp, so the public map is one cheap query and
 * every golgappa can explain itself.
 */
export const areaType = defineType({
  name: 'area',
  title: 'Area',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nameHi',
      title: 'Name (Hindi)',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name', maxLength: 60},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'city',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'centre',
      title: 'Centre',
      type: 'geopoint',
      description: 'Public report pins snap to this point.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'radiusM',
      title: 'Radius (metres)',
      type: 'number',
      initialValue: 500,
      validation: (rule) => rule.required().min(50).max(5000),
    }),
    defineField({
      name: 'state',
      title: 'Golgappa state',
      type: 'string',
      initialValue: 'crisp',
      options: {
        list: [
          {title: 'Crisp — no credible signal', value: 'crisp'},
          {title: 'Soggy — signals rising', value: 'soggy'},
          {title: 'Phoot gaya — contamination confirmed', value: 'phoot'},
          {title: 'Fresh batch — fix recorded', value: 'fresh'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stateReason',
      title: 'Why it is in this state',
      type: 'string',
      description: 'One line, shown to the public. Written by the risk scorer.',
    }),
    defineField({
      name: 'stateChangedAt',
      type: 'datetime',
    }),
    defineField({
      name: 'municipalContact',
      title: 'Municipal contact',
      type: 'reference',
      to: [{type: 'contact'}],
      description: 'Who receives the alert email when a case is confirmed.',
    }),
  ],
  preview: {
    select: {title: 'name', city: 'city', state: 'state', reason: 'stateReason'},
    prepare({title, city, state, reason}) {
      const badge: Record<string, string> = {
        crisp: 'Crisp',
        soggy: 'Soggy',
        phoot: 'PHOOT GAYA',
        fresh: 'Fresh batch',
      }
      return {
        title: `${title} — ${badge[state] ?? state}`,
        subtitle: reason ? `${city} · ${reason}` : city,
      }
    },
  },
})
