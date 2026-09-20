import {defineQuery} from 'next-sanity'

/** Everything the map needs, in one query — that is why area state is stored. */
export const AREAS_QUERY = defineQuery(`
  *[_type == "area"] | order(
    select(state == "phoot" => 0, state == "soggy" => 1, state == "fresh" => 2, 3),
    name asc
  ){
    _id, name, nameHi, city, state, stateReason, stateChangedAt,
    "slug": slug.current,
    "lat": centre.lat, "lng": centre.lng, radiusM
  }
`)

export const AREA_QUERY = defineQuery(`
  *[_type == "area" && slug.current == $slug][0]{
    _id, name, nameHi, city, state, stateReason, stateChangedAt,
    "slug": slug.current,
    "lat": centre.lat, "lng": centre.lng,

    "advice": *[_type == "advice" && state == ^.state][0]{
      headlineEn, headlineHi, textEn, textHi
    },

    "activeAlert": *[_type == "alert" && area._ref == ^._id && !defined(resolvedAt)]
      | order(issuedAt desc)[0]{
        severity, precautionsEn, precautionsHi, issuedAt,
        "verifiedBy": verifiedBy->{name, role}
      },

    // Anonymised: no location, no contact, no device hash.
    "reports": *[_type == "report" && area._ref == ^._id
        && submittedAt > dateTime(now()) - 60*60*24*14
        && !defined(duplicateOf)]
      | order(submittedAt desc)[0...50]{
        _id, submittedAt, waterSigns, sourceKind,
        "peopleIll": illness.people,
        "readings": readings[]{value, detected, method, "parameter": parameter->{parameter, unit, code}}
      },

    // Stored once on the source, read back in reverse. One relationship, both directions.
    "sources": *[_type == "waterSource" && references(^._id)]{_id, name, kind}
  }
`)
