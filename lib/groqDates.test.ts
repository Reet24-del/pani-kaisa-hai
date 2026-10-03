import assert from 'node:assert/strict'
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'
import {test} from 'node:test'

/**
 * Regression for the bug that hid every report on Day 4: datetimes are stored
 * as strings, and in GROQ a string compared with `now()` is never true. Any
 * comparison on a date field has to go through dateTime() on both sides.
 */

const DATE_FIELDS = ['submittedAt', 'lastSignalAt', 'stateChangedAt', 'issuedAt', 'resolvedAt', 'openedAt', 'claimedAt']
const ROOTS = ['app', 'sanity', 'lib', 'control-room/src']

function files(dir: string): string[] {
  let out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name === 'node_modules') continue
    if (statSync(path).isDirectory()) out = out.concat(files(path))
    else if (/\.tsx?$/.test(name) && !name.endsWith('.test.ts')) out.push(path)
  }
  return out
}

test('GROQ date comparisons wrap both sides in dateTime()', () => {
  const field = DATE_FIELDS.join('|')
  // A bare field next to a comparison operator, e.g. `submittedAt > now()`.
  const bare = new RegExp(`(?<!dateTime\\()\\b(${field})\\s*[<>]=?|[<>]=?\\s*(${field})\\b`)
  const offenders: string[] = []

  for (const file of ROOTS.flatMap(files)) {
    const source = readFileSync(file, 'utf8')
    // Only look inside template literals, which is where GROQ lives.
    for (const match of source.matchAll(/`[^`]*`/g)) {
      for (const line of match[0].split('\n')) {
        if (bare.test(line)) offenders.push(`${file}: ${line.trim()}`)
      }
    }
  }

  assert.deepEqual(offenders, [])
})
