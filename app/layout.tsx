import type {Metadata} from 'next'
import {Baloo_2, Hind, IBM_Plex_Mono} from 'next/font/google'

import './globals.css'

// Both text faces carry Latin and Devanagari, so Hindi never falls back to a
// system font. See DESIGN.md §4.
const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin', 'devanagari'],
  weight: ['600', '700'],
  display: 'swap',
})

const hind = Hind({
  variable: '--font-hind',
  subsets: ['latin', 'devanagari'],
  weight: ['400', '600'],
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pani Kaisa Hai?',
  description:
    'Is the water in your area safe today? Early warning from residents, not a lab test.',
}

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${baloo.variable} ${hind.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
