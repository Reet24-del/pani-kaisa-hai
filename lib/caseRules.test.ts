import assert from 'node:assert/strict'
import {test} from 'node:test'

import {areaStateFor, checkDecision, checkResolution, statusAfterScore} from './caseRules.ts'

const REASON = 'Checked the pump house, sewage line is leaking into the main.'

test('the scorer can raise a case to needs verification and never past it', () => {
  assert.equal(statusAfterScore('logged', 'watch'), 'watch')
  assert.equal(statusAfterScore('watch', 'needsVerification'), 'needsVerification')
  assert.equal(statusAfterScore('needsVerification', 'watch'), 'watch')
  // Even if a bug in the scorer returned "confirmed", it is capped.
  assert.equal(statusAfterScore('watch', 'confirmed'), 'needsVerification')
})

test('the scorer never moves a case a person has acted on', () => {
  for (const human of ['testRequested', 'confirmed', 'dismissed', 'resolved', 'closed']) {
    assert.equal(statusAfterScore(human, 'needsVerification'), human)
    assert.equal(statusAfterScore(human, 'logged'), human)
  }
})

test('a decision needs a real reason', () => {
  assert.match(checkDecision({status: 'needsVerification', decision: 'confirm', reason: 'bad'}) ?? '', /at least 10/)
  assert.match(checkDecision({status: 'needsVerification', decision: 'confirm', reason: '          x'}) ?? '', /at least 10/)
  assert.equal(checkDecision({status: 'needsVerification', decision: 'confirm', reason: REASON}), null)
})

test('a case can only be decided once', () => {
  assert.match(checkDecision({status: 'confirmed', decision: 'confirm', reason: REASON}) ?? '', /already confirmed/)
  for (const status of ['dismissed', 'resolved', 'closed', 'logged', 'watch', undefined]) {
    assert.ok(checkDecision({status, decision: 'confirm', reason: REASON}), `should refuse from ${status}`)
  }
})

test('a case waiting on a test can be confirmed or dismissed, not re-requested', () => {
  assert.equal(checkDecision({status: 'testRequested', decision: 'confirm', reason: REASON}), null)
  assert.equal(checkDecision({status: 'testRequested', decision: 'dismiss', reason: REASON}), null)
  assert.ok(checkDecision({status: 'testRequested', decision: 'requestTest', reason: REASON}))
})

test('unknown decisions are refused', () => {
  assert.ok(checkDecision({status: 'needsVerification', decision: 'publish', reason: REASON}))
})

test('marking an alert fixed needs a note and happens once', () => {
  assert.ok(checkResolution({note: 'done', alreadyResolved: false}))
  assert.equal(checkResolution({note: 'Sewer line repaired, chlorine back to 0.4', alreadyResolved: false}), null)
  assert.match(checkResolution({note: 'Sewer line repaired, chlorine back to 0.4', alreadyResolved: true}) ?? '', /already/)
})

const NOW = Date.parse('2026-10-03T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString()

test('a live alert always wins: phoot', () => {
  const r = areaStateFor({
    activeAlert: true,
    lastResolvedAt: daysAgo(1),
    openCases: [{status: 'watch', riskScore: 4}],
    quietDays: 5,
    now: NOW,
  })
  assert.equal(r.state, 'phoot')
})

test('a recent fix is a fresh batch, an old one is not', () => {
  assert.equal(areaStateFor({activeAlert: false, lastResolvedAt: daysAgo(2), openCases: [], quietDays: 5, now: NOW}).state, 'fresh')
  assert.equal(areaStateFor({activeAlert: false, lastResolvedAt: daysAgo(9), openCases: [], quietDays: 5, now: NOW}).state, 'crisp')
})

test('soggy comes from the scorer or from a pending lab test', () => {
  const watch = areaStateFor({
    activeAlert: false,
    lastResolvedAt: null,
    openCases: [{status: 'watch', riskScore: 3, scoreBreakdown: '3 reporters'}],
    quietDays: 5,
    now: NOW,
  })
  assert.deepEqual(watch, {state: 'soggy', reason: '3 reporters'})

  // Regression: asking for a test used to drop the area back to crisp.
  const testing = areaStateFor({
    activeAlert: false,
    lastResolvedAt: null,
    openCases: [{status: 'testRequested', riskScore: 7}],
    quietDays: 5,
    now: NOW,
  })
  assert.equal(testing.state, 'soggy')
  assert.match(testing.reason, /lab test/)
})

test('weak signals stay crisp but say what was reported', () => {
  const r = areaStateFor({
    activeAlert: false,
    lastResolvedAt: null,
    openCases: [{status: 'logged', riskScore: 1, scoreBreakdown: '1 reporter'}],
    quietDays: 5,
    now: NOW,
  })
  assert.equal(r.state, 'crisp')
  assert.match(r.reason, /1 reporter\. Not enough to act on yet/)
  assert.equal(areaStateFor({activeAlert: false, lastResolvedAt: null, openCases: [], quietDays: 5, now: NOW}).reason, 'No reports in the last few days.')
})
