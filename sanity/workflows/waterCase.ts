import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

/**
 * The verification workflow as data.
 *
 * The rule the whole product rests on is expressed here, not in prose: the
 * `aiCheck` activity is a system actor and can move a case as far as
 * `verification`. Confirming or dismissing lives in the `decide` activity,
 * whose actions are gated on the `verifier` role. An agent and a person use the
 * same transitions; only the person can take the last one.
 *
 * Workflows is in early access. Until the engine is deployed on the project,
 * the same stages and the same guard run through sanity/lib/cases.ts, which the
 * report route and the control room both call. See BUILD_LOG.md.
 */
export const waterCase = defineWorkflow({
  name: 'water-case',
  title: 'Water case verification',
  description:
    'Groups resident reports for one area, scores them, and routes the risky ones to a human verifier.',
  initialStage: 'intake',

  fields: [
    defineField({name: 'area', type: 'string', title: 'Area'}),
    defineField({name: 'riskScore', type: 'number', title: 'Risk score'}),
    defineField({name: 'bacteria', type: 'boolean', title: 'Bacteria found'}),
    defineField({name: 'summary', type: 'text', title: 'AI summary'}),
    defineField({
      name: 'decision',
      type: 'string',
      title: 'Decision',
      options: {
        list: [
          {title: 'Confirm contamination', value: 'confirm'},
          {title: 'Dismiss', value: 'dismiss'},
          {title: 'Ask for a test', value: 'requestTest'},
        ],
      },
    }),
    defineField({name: 'reason', type: 'text', title: 'Reason on the record'}),
  ],

  stages: [
    defineStage({
      name: 'intake',
      title: 'Intake',
      description: 'A new report arrived. The AI check scores it before anyone is asked to look.',
      activities: [
        defineActivity({
          name: 'aiCheck',
          title: 'AI check',
          description:
            'Drops duplicates, compares readings with the IS 10500 limits, scores the case and writes a summary.',
          actions: [
            defineAction({
              name: 'run',
              title: 'Run the check',
              status: 'done',
              effects: [{name: 'ai-check'}],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'toVerification',
          title: 'Needs a person',
          to: 'verification',
          when: '$fields.bacteria == true || $fields.riskScore >= 6',
        }),
        defineTransition({
          name: 'toWatch',
          title: 'Watch',
          to: 'watch',
          when: '$fields.riskScore >= 3',
        }),
        defineTransition({
          name: 'toClosed',
          title: 'Nothing in it',
          to: 'closed',
          when: '$fields.riskScore < 3',
        }),
      ],
    }),

    defineStage({
      name: 'watch',
      title: 'Watch',
      description:
        'The area is soggy on the map already. No person is needed — a warning is never held up waiting for one.',
      transitions: [
        defineTransition({
          name: 'escalate',
          title: 'Escalate',
          to: 'verification',
          when: '$fields.bacteria == true || $fields.riskScore >= 6',
        }),
        defineTransition({
          name: 'quiet',
          title: 'Quiet for 72 hours',
          to: 'closed',
          when: '$fields.riskScore < 3',
        }),
      ],
    }),

    defineStage({
      name: 'verification',
      title: 'Verification',
      description: 'A health worker decides. Nothing here can be done by a machine.',
      activities: [
        defineActivity({
          name: 'decide',
          title: 'Decide',
          actions: [
            defineAction({
              name: 'confirm',
              title: 'Confirm contamination',
              roles: ['verifier'],
              status: 'done',
              effects: [{name: 'create-alert'}, {name: 'notify-municipality'}],
            }),
            defineAction({
              name: 'dismiss',
              title: 'Dismiss',
              roles: ['verifier'],
              status: 'done',
            }),
            defineAction({
              name: 'requestTest',
              title: 'Ask for a test',
              roles: ['verifier'],
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'confirmed',
          title: 'Confirmed',
          to: 'alerted',
          when: '$fields.decision == "confirm"',
        }),
        defineTransition({
          name: 'dismissed',
          title: 'Dismissed',
          to: 'closed',
          when: '$fields.decision == "dismiss"',
        }),
        defineTransition({
          name: 'testRequested',
          title: 'Test requested',
          to: 'watch',
          when: '$fields.decision == "requestTest"',
        }),
      ],
    }),

    defineStage({
      name: 'alerted',
      title: 'Alerted',
      description: 'The area is phoot gaya, residents are warned and the municipality has the evidence.',
      activities: [
        defineActivity({
          name: 'resolve',
          title: 'Record the fix',
          actions: [
            defineAction({
              name: 'resolve',
              title: 'Mark resolved',
              roles: ['verifier'],
              status: 'done',
              effects: [{name: 'resolve-alert'}],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'resolved', title: 'Fixed', to: 'resolved'}),
      ],
    }),

    defineStage({
      name: 'resolved',
      title: 'Recovering',
      description: 'Fresh batch. After five quiet days the area goes back to crisp.',
      transitions: [
        defineTransition({
          name: 'recovered',
          title: 'Recovered',
          to: 'closed',
          when: 'true',
        }),
      ],
    }),

    defineStage({
      name: 'closed',
      title: 'Closed',
      description: 'Terminal. The evidence and the decision stay on the record.',
    }),
  ],
})
