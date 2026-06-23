import assert from 'node:assert/strict'

import { tools } from '../composables/useTools'
import { formatFileSize } from '../utils/file'
import { compareJsonObjects, smartFix, tryParseJson } from '../utils/json-tools'
import { stringToBase64, base64ToString } from '../utils/base64-tools'
import { parseJwt } from '../utils/jwt-tools'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_CN'
import { CronExpressionParser } from 'cron-parser'

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

  // Base64 中文编解码测试
  assert.equal(stringToBase64('Hello! 开发者'), 'SGVsbG8hIOW8gOWPkeiAhQ==')
  assert.equal(base64ToString('SGVsbG8hIOW8gOWPkeiAhQ=='), 'Hello! 开发者')
  assert.throws(() => base64ToString('!!!非法base64!!!'))

  // JWT 解析测试
  const sampleHeaderB64 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
  const samplePayloadB64 = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
  const sampleSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const sampleJwt = `${sampleHeaderB64}.${samplePayloadB64}.${sampleSignature}`

  const jwtResult = parseJwt(sampleJwt)
  assert.equal(jwtResult.success, true)
  if (jwtResult.success) {
    assert.equal(jwtResult.header.alg, 'HS256')
    assert.equal(jwtResult.payload.name, 'John Doe')
    assert.equal(jwtResult.signature, sampleSignature)
  }

  const badJwtResult = parseJwt('header.payload')
  assert.equal(badJwtResult.success, false)
  assert.match(badJwtResult.error || '', /格式错误/)

  const routeSet = new Set(tools.map(tool => tool.route))
  assert.equal(routeSet.size, tools.length)

  // Cron 表达式测试
  const parsedCron = cronstrue.toString('*/5 * * * *', { locale: 'zh_CN' })
  assert.match(parsedCron, /每隔 5 分钟/)

  const interval = CronExpressionParser.parse('0 0 12 * * *')
  const firstExecution = interval.next().toDate()
  assert.equal(firstExecution.getHours(), 12)
  assert.equal(firstExecution.getMinutes(), 0)
  assert.equal(firstExecution.getSeconds(), 0)

  console.log('tests passed')
}

run()
