/** The four golgappa states, shared by the site, the control room and the scorer. */

export type AreaState = 'crisp' | 'soggy' | 'phoot' | 'fresh'

export const STATE_LABEL: Record<AreaState, string> = {
  crisp: 'Crisp',
  soggy: 'Soggy',
  phoot: 'Phoot gaya',
  fresh: 'Fresh batch',
}

export const STATE_MEANING: Record<AreaState, string> = {
  crisp: 'No credible signal',
  soggy: 'Complaints are rising',
  phoot: 'Contamination confirmed',
  fresh: 'Fixed, recovering',
}

/** Worst first — the order the map and the queue sort by. */
export const STATE_ORDER: AreaState[] = ['phoot', 'soggy', 'fresh', 'crisp']

export function isAreaState(value: unknown): value is AreaState {
  return value === 'crisp' || value === 'soggy' || value === 'phoot' || value === 'fresh'
}
