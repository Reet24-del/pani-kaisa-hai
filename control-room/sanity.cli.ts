import {defineCliConfig} from 'sanity/cli'

/**
 * App SDK app config. `organizationId` is filled in the first time you run
 * `npx sanity app dev` while signed in; the app is then deployed to the Sanity
 * Dashboard with `npx sanity app deploy`.
 */
export default defineCliConfig({
  app: {
    entry: './src/App.tsx',
    organizationId: process.env.SANITY_STUDIO_ORGANIZATION_ID,
  },
})
