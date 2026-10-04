import {defineBlueprint, defineRobotToken, defineScheduledFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    // The function's own credentials: Editor on this project, nothing else.
    defineRobotToken({
      name: 'daily-tick-robot',
      label: 'Daily tick (scheduled function)',
      memberships: [{resourceType: 'project', resourceId: 'ya4g5th1', roleNames: ['editor']}],
    }),
    // 00:15 UTC daily. The Vercel cron at 00:30 calls the same runTick as a backup;
    // running it twice is harmless because every write is idempotent.
    defineScheduledFunction({
      name: 'daily-tick',
      event: {expression: '15 0 * * *'},
      // Re-deriving every area takes longer than the 10 second default.
      timeout: 120,
      robotToken: '$.resources.daily-tick-robot.token',
    }),
  ],
})
