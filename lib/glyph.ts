import type {AreaState} from './states'

/**
 * The golgappa glyph as an SVG string, for places that need markup rather than
 * React — Leaflet's divIcon, and e-mail. Same shapes as components/Golgappa.tsx;
 * colours come from the global `.pin-*` classes so both themes work.
 */
export function golgappaSvg(state: AreaState, size = 44): string {
  const shapes: Record<AreaState, string> = {
    crisp: `
      <circle class="pin-body" cx="20" cy="21" r="14"/>
      <ellipse class="pin-hole" cx="20" cy="11.5" rx="4.5" ry="2"/>
      <path class="pin-shine" d="M11 19c1-4 4-7 8-8"/>`,
    soggy: `
      <path class="pin-body pin-body-soggy" d="M6 24c0-6.5 6.3-11 14-11s14 4.5 14 11c0 4.6-6.3 7-14 7S6 28.6 6 24z"/>
      <ellipse class="pin-hole" cx="20" cy="16" rx="4" ry="1.6"/>
      <path class="pin-pani" d="M27 30.5s-2.4 3.1-2.4 4.9a2.4 2.4 0 0 0 4.8 0c0-1.8-2.4-4.9-2.4-4.9z"/>`,
    phoot: `
      <circle class="pin-body" cx="20" cy="22" r="13"/>
      <path class="pin-crack" d="M14 11.5l4 6.5-3.5 4 5 4.5-2 6.5"/>
      <path class="pin-pani" d="M31 6.5s-2 2.6-2 4a2 2 0 0 0 4 0c0-1.4-2-4-2-4z"/>
      <path class="pin-pani" d="M7.5 29s-1.6 2-1.6 3.2a1.6 1.6 0 0 0 3.2 0c0-1.2-1.6-3.2-1.6-3.2z"/>`,
    fresh: `
      <circle class="pin-body" cx="19" cy="22" r="13"/>
      <ellipse class="pin-hole" cx="19" cy="13" rx="4" ry="1.7"/>
      <path class="pin-spark" d="M33 5v7M29.5 8.5h7M34 19v4M32 21h4"/>`,
  }

  return `<svg class="pin-svg" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${shapes[state]}</svg>`
}
