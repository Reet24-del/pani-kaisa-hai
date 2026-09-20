import assert from 'node:assert/strict'
import {test} from 'node:test'

import {DEFAULT_SETTINGS, breakdown, judgeReading, scoreReports, type ReportLike} from './risk.ts'

const TDS = {code: 'tds', parameter: 'TDS', rule: 'max' as const, acceptableMax: 500, permissibleMax: 2000}
const PH = {code: 'ph', parameter: 'pH', rule: 'range' as const, acceptableMin: 6.5, acceptableMax: 8.5}
const CHLORINE = {code: 'chlorine', parameter: 'Chlorine', rule: 'min' as const, acceptableMin: 0.2}
const ECOLI = {code: 'ecoli', parameter: 'E. coli', rule: 'absent' as const}

const now = new Date('2026-09-20T12:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

test('judges readings against their limits', () => {
  assert.equal(judgeReading({value: 320, parameter: TDS}), 'ok')
  assert.equal(judgeReading({value: 780, parameter: TDS}), 'overAcceptable')
  assert.equal(judgeReading({value: 2400, parameter: TDS}), 'overPermissible')

  assert.equal(judgeReading({value: 7.1, parameter: PH}), 'ok')
  assert.equal(judgeReading({value: 9.1, parameter: PH}), 'overAcceptable')
  assert.equal(judgeReading({value: 5.2, parameter: PH}), 'overPermissible')

  assert.equal(judgeReading({value: 0.4, parameter: CHLORINE}), 'ok')
  assert.equal(judgeReading({value: 0.1, parameter: CHLORINE}), 'overAcceptable')
  assert.equal(judgeReading({value: 0, parameter: CHLORINE}), 'overPermissible')

  assert.equal(judgeReading({detected: false, parameter: ECOLI}), 'ok')
  assert.equal(judgeReading({detected: true, parameter: ECOLI}), 'detected')
  assert.equal(judgeReading({parameter: ECOLI}), 'unknown')
  assert.equal(judgeReading({value: 5}), 'unknown')
})

test('the Sector 14 example from the PRD scores 7 and needs a person', () => {
  const reports: ReportLike[] = [
    {_id: 'r1', submittedAt: hoursAgo(10), deviceHash: 'a', waterSigns: ['smell']},
    {_id: 'r2', submittedAt: hoursAgo(8), deviceHash: 'b', waterSigns: ['smell']},
    {
      _id: 'r3',
      submittedAt: hoursAgo(2),
      deviceHash: 'c',
      waterSigns: ['smell'],
      illness: {households: 1, people: 2},
      readings: [{value: 780, parameter: TDS}],
    },
  ]

  const score = scoreReports(reports, DEFAULT_SETTINGS, {now})
  assert.equal(score.score, 7)
  assert.equal(score.status, 'needsVerification')
  assert.match(breakdown(score), /= 7$/)
})

test('three taps from one phone count once', () => {
  const same = (n: number): ReportLike => ({
    _id: `r${n}`,
    submittedAt: hoursAgo(n),
    deviceHash: 'same-phone',
    waterSigns: ['colour'],
  })
  const score = scoreReports([same(1), same(2), same(3)], DEFAULT_SETTINGS, {now})
  assert.equal(score.score, 1)
  assert.equal(score.status, 'logged')
})

test('reports older than the window are ignored', () => {
  const old: ReportLike[] = [
    {_id: 'r1', submittedAt: hoursAgo(80), deviceHash: 'a', waterSigns: ['smell']},
    {_id: 'r2', submittedAt: hoursAgo(90), deviceHash: 'b', waterSigns: ['smell']},
    {_id: 'r3', submittedAt: hoursAgo(100), deviceHash: 'c', waterSigns: ['smell']},
  ]
  const score = scoreReports(old, DEFAULT_SETTINGS, {now})
  assert.equal(score.score, 0)
  assert.equal(score.reportsCounted, 0)
})

test('bacteria go to a person even with a low score', () => {
  const score = scoreReports(
    [
      {
        _id: 'r1',
        submittedAt: hoursAgo(1),
        deviceHash: 'a',
        waterSigns: ['smell'],
        readings: [{detected: true, parameter: ECOLI}],
      },
    ],
    DEFAULT_SETTINGS,
    {now},
  )
  assert.equal(score.score, 1)
  assert.equal(score.bacteria, true)
  assert.equal(score.status, 'needsVerification')
  assert.match(score.reason, /bacteria found/)
})

test('three reporters alone turn an area soggy without a person', () => {
  const score = scoreReports(
    [
      {_id: 'r1', submittedAt: hoursAgo(5), deviceHash: 'a', waterSigns: ['smell']},
      {_id: 'r2', submittedAt: hoursAgo(4), deviceHash: 'b', waterSigns: ['taste']},
      {_id: 'r3', submittedAt: hoursAgo(3), deviceHash: 'c', waterSigns: ['particles']},
    ],
    DEFAULT_SETTINGS,
    {now},
  )
  assert.equal(score.score, 3)
  assert.equal(score.status, 'watch')
})

test('heavy rain only counts past the threshold', () => {
  const reports: ReportLike[] = [
    {_id: 'r1', submittedAt: hoursAgo(5), deviceHash: 'a', waterSigns: ['colour']},
  ]
  assert.equal(scoreReports(reports, DEFAULT_SETTINGS, {now, rainMm48h: 12}).score, 1)
  assert.equal(scoreReports(reports, DEFAULT_SETTINGS, {now, rainMm48h: 65}).score, 2)
})
