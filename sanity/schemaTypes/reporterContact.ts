import {defineField, defineType} from 'sanity'

/**
 * A reporter's phone or email, kept off the report.
 *
 * The dataset is public so the map can read it without a token. Documents with
 * a dot in their id (`private.contact.<reportId>`) are on a path, and Sanity
 * never returns those to unauthenticated requests. So a verifier signed in to
 * the Studio can call a reporter back, and nobody querying the public API can.
 */
export const reporterContactType = defineType({
  name: 'reporterContact',
  title: 'Reporter contact (private)',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'report',
      type: 'reference',
      to: [{type: 'report'}],
      weak: true,
    }),
    defineField({name: 'phone', type: 'string'}),
    defineField({name: 'email', type: 'string'}),
  ],
  preview: {
    select: {phone: 'phone', email: 'email', area: 'report.area.name'},
    prepare({phone, email, area}) {
      return {title: phone || email || 'No contact', subtitle: area ? `Report in ${area}` : 'Report'}
    },
  },
})
