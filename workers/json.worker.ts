import { tryParseJson, compareJsonObjects } from '../utils/json-tools'

self.onmessage = (e: MessageEvent) => {
  const { id, type, payload } = e.data

  try {
    if (type === 'parse') {
      const { jsonStr, autoFix } = payload
      const result = tryParseJson(jsonStr, autoFix)
      self.postMessage({ id, success: true, result })
    } else if (type === 'compare') {
      const { leftStr, rightStr } = payload
      const leftResult = tryParseJson(leftStr, true)
      const rightResult = tryParseJson(rightStr, true)

      if (!leftResult.success) {
        self.postMessage({ id, success: false, error: `左侧 JSON 错误: ${leftResult.error}` })
        return
      }

      if (!rightResult.success) {
        self.postMessage({ id, success: false, error: `右侧 JSON 错误: ${rightResult.error}` })
        return
      }

      const diff = compareJsonObjects(leftResult.data, rightResult.data, '')
      self.postMessage({ id, success: true, result: diff })
    }
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message || 'Worker 发生未知错误' })
  }
}
