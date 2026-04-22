import assert from 'node:assert/strict'

import { tools } from '../composables/useTools'
import { formatFileSize } from '../utils/file'
import { compareJsonObjects, smartFix, tryParseJson } from '../utils/json-tools'

const run = () => {
  assert.equal(formatFileSize(0), '0 Bytes')
  assert.equal(formatFileSize(1024), '1 KB')
  assert.equal(formatFileSize(1024 * 1024), '1 MB')

  const source = "{foo: 'bar', trailing: true,}"
  const parsed = tryParseJson(source, true)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.deepEqual(parsed.data, { foo: 'bar', trailing: true })
  }
  assert.match(smartFix(source), /"foo": "bar"/)

  const diff = compareJsonObjects(
    { a: 1, nested: { ok: true }, list: [1, 2] },
    { a: 2, nested: { ok: false }, list: [1, 3], extra: true },
  )
  assert.ok(diff.some(item => item.path === 'a' && item.type === 'value_change'))
  assert.ok(diff.some(item => item.path === 'nested.ok' && item.type === 'value_change'))
  assert.ok(diff.some(item => item.path === 'list[1]' && item.type === 'value_change'))
  assert.ok(diff.some(item => item.path === 'extra' && item.type === 'added'))

  const routeSet = new Set(tools.map(tool => tool.route))
  assert.equal(routeSet.size, tools.length)

  console.log('tests passed')
}

run()
