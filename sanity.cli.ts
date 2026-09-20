import {defineCliConfig} from 'sanity/cli'

// Read straight from the environment so `sanity init` can run before the
// variables exist.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({
  api: {projectId, dataset},
  autoUpdates: true,
})
