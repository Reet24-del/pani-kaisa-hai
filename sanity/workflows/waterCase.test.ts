import assert from 'node:assert/strict'
import {test} from 'node:test'

import {waterCase} from './waterCase.ts'

/**
 * `defineWorkflow` validates at import time, so loading this file at all proves
 * the definition is well formed. The assertions below cover the part that is a
 * product rule rather than a shape rule.
 */

const stage = (name: string) => waterCase.stages.find((s) => s.name === name)

test('the stages run intake → watch → verification → alerted → resolved → closed', () => {
  assert.deepEqual(
    waterCase.stages.map((s) => s.name),
    ['intake', 'watch', 'verification', 'alerted', 'resolved', 'closed'],
  )
  assert.equal(waterCase.initialStage, 'intake')
})

test('a machine can reach verification but never past it', () => {
  const intake = stage('intake')
  const targets = (intake?.transitions ?? []).map((t) => t.to)
  assert.ok(targets.includes('verification'), 'the AI check can escalate')
  assert.ok(!targets.includes('alerted'), 'the AI check can never raise an alert')
})

test('every decision in verification is gated on the verifier role', () => {
  const decide = stage('verification')?.activities?.find((a) => a.name === 'decide')
  assert.ok(decide, 'the decide activity exists')
  const actions = decide?.actions ?? []
  assert.ok(actions.length >= 3)
  for (const action of actions) {
    const condition = JSON.stringify(action)
    assert.match(condition, /verifier/, `${action.name} must be limited to verifiers`)
  }
})

test('only confirming raises an alert', () => {
  const confirmed = stage('verification')?.transitions?.find((t) => t.to === 'alerted')
  assert.ok(confirmed)
  assert.match(JSON.stringify(confirmed), /confirm/)
})
