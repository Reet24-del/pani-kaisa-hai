import type {StructureResolver} from 'sanity/structure'

/**
 * Desks that match how the work actually arrives: things waiting on a person
 * first, reference data last.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Pani Kaisa Hai?')
    .items([
      S.listItem()
        .title('Needs verification')
        .child(
          S.documentList()
            .title('Needs verification')
            .filter('_type == "waterCase" && status == "needsVerification"')
            .defaultOrdering([{field: 'riskScore', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Active alerts')
        .child(
          S.documentList()
            .title('Active alerts')
            .filter('_type == "alert" && !defined(resolvedAt)')
            .defaultOrdering([{field: 'issuedAt', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Unmapped reports')
        .child(
          S.documentList()
            .title('Reports outside every area')
            .filter('_type == "report" && !defined(area)')
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
        ),
      S.divider(),
      S.listItem()
        .title('Areas by state')
        .child(
          S.list()
            .title('Areas by state')
            .items(
              [
                ['phoot', 'Phoot gaya'],
                ['soggy', 'Soggy'],
                ['fresh', 'Fresh batch'],
                ['crisp', 'Crisp'],
              ].map(([value, title]) =>
                S.listItem()
                  .title(title)
                  .id(value)
                  .child(
                    S.documentList()
                      .title(title)
                      .filter('_type == "area" && state == $state')
                      .params({state: value}),
                  ),
              ),
            ),
        ),
      S.documentTypeListItem('waterCase').title('All cases'),
      S.documentTypeListItem('report').title('All reports'),
      S.listItem()
        .title('Reporter contacts (private)')
        .child(
          S.documentList()
            .title('Reporter contacts')
            .filter('_type == "reporterContact"')
            .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
        ),
      S.documentTypeListItem('waterSource').title('Water sources'),
      S.divider(),
      S.documentTypeListItem('safetyLimit').title('Safety limits (IS 10500)'),
      S.listItem()
        .title('Risk settings')
        .id('riskSettings')
        .child(S.document().schemaType('riskSettings').documentId('riskSettings')),
      S.documentTypeListItem('advice').title('Advice per state'),
      S.documentTypeListItem('contact').title('People'),
    ])
