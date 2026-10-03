import assert from 'node:assert/strict'
import {test} from 'node:test'

import {cleanReport, coarsen, privateContactId} from './reportInput.ts'

const known = {parameterIds: ['limit-tds', 'limit-ecoli']}
const base = {lat: 22.7196, lng: 75.8577, waterSigns: ['smell']}

test('a report needs a place and at least one signal', () => {
  assert.equal(cleanReport({waterSigns: ['smell']}, known).ok, false)
  assert.equal(cleanReport({lat: 'x', lng: 75, waterSigns: ['smell']}, known).ok, false)
  assert.equal(cleanReport({lat: 95, lng: 75, waterSigns: ['smell']}, known).ok, false)
  assert.equal(cleanReport({lat: 22.7, lng: 75.8}, known).ok, false)
  assert.equal(cleanReport({lat: 22.7, lng: 75.8, people: 2}, known).ok, true)
})

test('only known values get through', () => {
  const r = cleanReport(
    {
      ...base,
      waterSigns: ['smell', 'smell', '<script>', 'colour'],
      sourceKind: 'river',
      symptoms: ['fever', 'anything at all', 'fever'],
      people: 9999,
    },
    known,
  )
  assert.ok(r.ok)
  if (!r.ok) return
  assert.deepEqual(r.report.waterSigns, ['smell', 'colour'])
  assert.equal(r.report.sourceKind, 'unknown')
  assert.deepEqual(r.report.symptoms, ['fever'])
  assert.equal(r.report.people, 200)
  assert.equal(r.report.households, 1)
})

test('readings must point at a real limit and carry a usable value', () => {
  const r = cleanReport(
    {
      ...base,
      readings: [
        {parameterId: 'limit-tds', value: 780, method: 'meter'},
        {parameterId: 'limit-made-up', value: 1},
        {parameterId: 'limit-ecoli', detected: true, method: 'telepathy'},
        {parameterId: 'limit-tds'},
        {parameterId: 'limit-tds', value: -5},
        'nonsense',
      ],
    },
    known,
  )
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.report.readings.length, 3)
  assert.equal(r.report.readings[0].value, 780)
  assert.equal(r.report.readings[0].method, 'meter')
  assert.equal(r.report.readings[1].detected, true)
  assert.equal(r.report.readings[1].method, 'strip')
  assert.equal(r.report.readings[2].value, 0)
})

test('contact details are cleaned, and junk is dropped', () => {
  const good = cleanReport({...base, contact: {phone: '+91 98765-43210', email: ' asha@example.org '}}, known)
  assert.ok(good.ok)
  if (good.ok) assert.deepEqual(good.report.contact, {phone: '+919876543210', email: 'asha@example.org'})

  const junk = cleanReport({...base, contact: {phone: 'call me', email: 'nope'}}, known)
  assert.ok(junk.ok)
  if (junk.ok) assert.equal(junk.report.contact, null)
})

test('the stored point is rounded to about 100 m', () => {
  assert.equal(coarsen(22.719634), 22.72)
  assert.equal(coarsen(75.857712), 75.858)
})

test('contact documents live on a private path', () => {
  // A dot in the id keeps the document out of unauthenticated queries.
  assert.equal(privateContactId('report-abc'), 'private.contact.report-abc')
  assert.ok(privateContactId('x').includes('.'))
})
