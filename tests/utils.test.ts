import test from 'node:test'
import assert from 'node:assert/strict'

import { formatFileSize } from '../utils/file'
import { compareJsonObjects, smartFix, tryParseJson } from '../utils/json-tools'
import { tools } from '../composables/useTools'

test('formatFileSize formats bytes and megabytes', () => {
  assert.equal(formatFileSize(0), '0 Bytes')
  assert.equal(formatFileSize(1024), '1 KB')
  assert.equal(formatFileSize(1024 * 1024), '1 MB')
})

test('smartFix repairs common JSON issues', () => {
  const source = "{foo: 'bar', trailing: true,}"
  const result = tryParseJson(source, true)

  assert.equal(result.success, true)
  if (result.success) {
    assert.deepEqual(result.data, { foo: 'bar', trailing: true })
  }

  assert.match(smartFix(source), /"foo": "bar"/)
})

test('compareJsonObjects returns nested differences', () => {
  const diff = compareJsonObjects(
    { a: 1, nested: { ok: true }, list: [1, 2] },
    { a: 2, nested: { ok: false }, list: [1, 3], extra: true },
  )

  assert.ok(diff.some(item => item.path === 'a' && item.type === 'value_change'))
  assert.ok(diff.some(item => item.path === 'nested.ok' && item.type === 'value_change'))
  assert.ok(diff.some(item => item.path === 'list[1]' && item.type === 'value_change'))
  assert.ok(diff.some(item => item.path === 'extra' && item.type === 'added'))
})

test('tools metadata stays unique by route', () => {
  const routeSet = new Set(tools.map(tool => tool.route))
  assert.equal(routeSet.size, tools.length)
})
