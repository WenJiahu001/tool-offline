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

  // 进阶修复测试 (jsonrepair 独有能力)
  // 1. 缺失属性间的逗号
  const missingComma = '{"a": 1 "b": 2}'
  const parsedMC = tryParseJson(missingComma, true)
  assert.equal(parsedMC.success, true)
  if (parsedMC.success) {
    assert.deepEqual(parsedMC.data, { a: 1, b: 2 })
  }

  // 2. 未转义字符修复
  const unescapedNewlines = '{\n  "text": "hello\\nworld"\n}'
  const parsedUN = tryParseJson(unescapedNewlines, true)
  assert.equal(parsedUN.success, true)
  if (parsedUN.success) {
    assert.deepEqual(parsedUN.data, { text: "hello\nworld" })
  }

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

    // Properties Test
  const { parseProperties, stringifyProperties } = require('../utils/properties')
  const propSource = 'a.b=1\na.c=2\nlist.0=hi\nlist.1=hello'
  const parsedProp = parseProperties(propSource)
  assert.equal(parsedProp.a.b, '1')
  assert.equal(parsedProp.a.c, '2')
  assert.deepEqual(parsedProp.list, ['hi', 'hello'])
  
  const stringifiedProp = stringifyProperties({ nested: { foo: 'bar', arr: [1, 2] }})
  assert.match(stringifiedProp, /nested.foo=bar/)
  assert.match(stringifiedProp, /nested.arr.0=1/)

  // SQL Minify Test
  const { minifySql } = require('../utils/sql-minify')

  // 1. 分号隔开的 SQL，每句压缩成一行
  const sql1 = 'SELECT * FROM users; SELECT * FROM orders;'
  assert.equal(minifySql(sql1), 'SELECT * FROM users;\nSELECT * FROM orders;')

  // 2. 带注释的 SQL，不删注释且各占一行
  const sql2 = `
    -- 获取用户列表
    SELECT * FROM users; -- 这里是行尾注释
    /* 获取订单
       多行注释测试 */
    SELECT * FROM orders;
  `
  const expected2 = [
    '-- 获取用户列表',
    'SELECT * FROM users;',
    '-- 这里是行尾注释',
    '/* 获取订单 多行注释测试 */',
    'SELECT * FROM orders;'
  ].join('\n')
  assert.equal(minifySql(sql2), expected2)

  // 3. 带有分号和注释符号的字符串，不应被拆行或误判为注释
  const sql3 = "SELECT 'hello;world', \"test -- comment\", `a#b` FROM users;"
  assert.equal(minifySql(sql3), "SELECT 'hello;world', \"test -- comment\", `a#b` FROM users;")

  console.log('tests passed')
}

run()
