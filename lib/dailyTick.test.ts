import assert from 'node:assert/strict'
import {test} from 'node:test'

import {runTick, type TickClient} from './dailyTick.ts'

const DAY = 86_400_000
const NOW = Date.parse('2026-10-10T00:30:00Z')

/** A stand-in for the Sanity client: answers the tick's queries, records its patches. */
function fakeClient(data: {
  staleCases?: {_id: string; areaId: string}[]
  freshAreas?: {_id: string}[]
  areas?: string[]
  area?: {state: string; activeAlert: unknown; lastResolvedAt: string | null; openCases: unknown[]}
}) {
  const patches: {id: string; set: Record<string, unknown>}[] = []
  const params: Record<string, unknown>[] = []
  const client: TickClient = {
    async fetch<T>(query: string, p?: Record<string, unknown>) {
      if (p) params.push(p)
      if (query.includes('"riskSettings"')) return {windowHours: 72, quietDays: 3} as T
      if (query.includes('_type == "waterCase" && status in ["logged", "watch"]')) return (data.staleCases ?? []) as T
      if (query.includes('state == "fresh"')) return (data.freshAreas ?? []) as T
      if (query === '*[_type == "area"]._id') return (data.areas ?? []) as T
      if (query.includes('"activeAlert"')) return (data.area ?? {state: 'crisp', activeAlert: null, lastResolvedAt: null, openCases: []}) as T
      throw new Error(`unexpected query: ${query}`)
    },
    patch(id) {
      return {set: (set) => ({commit: async () => patches.push({id, set})})}
    },
  }
  return {client, patches, params}
}

test('quiet cases close and their area is re-derived', async () => {
  const {client, patches} = fakeClient({staleCases: [{_id: 'case-1', areaId: 'area-ward-22'}], areas: ['area-ward-22']})
  const result = await runTick(client, NOW)

  assert.deepEqual(result, {closed: 1, recovered: 0})
  assert.deepEqual(patches[0], {id: 'case-1', set: {status: 'closed'}})
  assert.equal(patches[1].id, 'area-ward-22')
})

test('a fresh batch past its quiet days goes back to crisp', async () => {
  // areaStateFor reads the real clock, so the fix is dated relative to it.
  const {client, patches} = fakeClient({
    freshAreas: [{_id: 'area-sector-14'}],
    areas: ['area-sector-14'],
    area: {state: 'fresh', activeAlert: null, lastResolvedAt: new Date(Date.now() - 5 * DAY).toISOString(), openCases: []},
  })
  const result = await runTick(client, NOW)

  assert.deepEqual(result, {closed: 0, recovered: 1})
  assert.equal(patches.length, 1)
  assert.equal(patches[0].id, 'area-sector-14')
  assert.equal(patches[0].set.state, 'crisp')
})

test('every area is re-derived daily, even with nothing to close', async () => {
  const {client, patches} = fakeClient({areas: ['area-a', 'area-b']})
  assert.deepEqual(await runTick(client, NOW), {closed: 0, recovered: 0})
  assert.deepEqual(patches.map((p) => p.id), ['area-a', 'area-b'])
  // A crisp area that stays crisp only gets its reason refreshed, not a new state.
  assert.equal(patches[0].set.state, undefined)
})

test('the cutoffs come from riskSettings, not constants', async () => {
  const {client, params} = fakeClient({})
  await runTick(client, NOW)
  const cutoffs = params.map((p) => p.cutoff)
  assert.deepEqual(cutoffs, [new Date(NOW - 72 * 3600_000).toISOString(), new Date(NOW - 3 * DAY).toISOString()])
})
