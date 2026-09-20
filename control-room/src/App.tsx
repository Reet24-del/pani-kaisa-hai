import {SanityApp} from '@sanity/sdk-react'
import type {SanityConfig} from '@sanity/sdk'
import {Card, Flex, Spinner, ThemeProvider, studioTheme} from '@sanity/ui'

import {ControlRoom} from './ControlRoom'

/**
 * The Control Room, as a Sanity App SDK app.
 *
 * It runs inside the Sanity Dashboard against the signed-in user, so the queue
 * is live without any polling and every decision is attributable. The same
 * queue exists at /control in the Next.js app for people without a Sanity
 * login — both obey the same rule: the AI check can raise a case to
 * "needs verification", and only a person can confirm or dismiss it.
 */
const config: SanityConfig = {
  projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: import.meta.env.SANITY_STUDIO_DATASET ?? 'production',
}

export default function App() {
  return (
    <ThemeProvider theme={studioTheme}>
      <SanityApp config={config} fallback={<Loading />}>
        <ControlRoom />
      </SanityApp>
    </ThemeProvider>
  )
}

function Loading() {
  return (
    <Card height="fill" padding={6}>
      <Flex align="center" justify="center" height="fill">
        <Spinner muted />
      </Flex>
    </Card>
  )
}
