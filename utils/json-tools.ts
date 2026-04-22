export const smartFix = (jsonStr: string) => {
  let fixed = jsonStr.trim()

  fixed = fixed.replace(/\/\/.*$/gm, '')
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '')
  fixed = fixed.replace(/'/g, '"')
  fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  fixed = fixed.replace(/,\s*([\}\]])/g, '$1')
  fixed = fixed.replace(/:\s*undefined/g, ': null')
  fixed = fixed.replace(/:\s*NaN/g, ': null')
  fixed = fixed.replace(/:\s*Infinity/g, ': null')
  fixed = fixed.replace(/:\s*-Infinity/g, ': null')

  return fixed
}

export const tryParseJson = (jsonStr: string, autoFix = false) => {
  try {
    return { success: true as const, data: JSON.parse(jsonStr), fixed: false }
  } catch (error) {
    if (!autoFix) {
      return { success: false as const, error: (error as Error).message }
    }

    try {
      const fixed = smartFix(jsonStr)
      const data = JSON.parse(fixed)
      return { success: true as const, data, fixed: true, fixedStr: fixed }
    } catch (fixError) {
      return { success: false as const, error: (fixError as Error).message }
    }
  }
}

export const getJsonValueType = (value: unknown) => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

export interface JsonDiffItem {
  path: string
  type: 'type_change' | 'added' | 'removed' | 'value_change'
  left?: unknown
  right?: unknown
}

export const compareJsonObjects = (left: unknown, right: unknown, path = ''): JsonDiffItem[] => {
  const diffs: JsonDiffItem[] = []

  const leftType = getJsonValueType(left)
  const rightType = getJsonValueType(right)

  if (leftType !== rightType) {
    diffs.push({
      path: path || '(root)',
      type: 'type_change',
      left: { type: leftType, value: left },
      right: { type: rightType, value: right },
    })
    return diffs
  }

  if (leftType === 'object' && left && right) {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const allKeys = new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])

    for (const key of allKeys) {
      const nextPath = path ? `${path}.${key}` : key
      if (!(key in leftRecord)) {
        diffs.push({ path: nextPath, type: 'added', right: rightRecord[key] })
      } else if (!(key in rightRecord)) {
        diffs.push({ path: nextPath, type: 'removed', left: leftRecord[key] })
      } else {
        diffs.push(...compareJsonObjects(leftRecord[key], rightRecord[key], nextPath))
      }
    }

    return diffs
  }

  if (leftType === 'array') {
    const leftArray = left as unknown[]
    const rightArray = right as unknown[]
    const maxLength = Math.max(leftArray.length, rightArray.length)

    for (let index = 0; index < maxLength; index += 1) {
      const nextPath = `${path}[${index}]`
      if (index >= leftArray.length) {
        diffs.push({ path: nextPath, type: 'added', right: rightArray[index] })
      } else if (index >= rightArray.length) {
        diffs.push({ path: nextPath, type: 'removed', left: leftArray[index] })
      } else {
        diffs.push(...compareJsonObjects(leftArray[index], rightArray[index], nextPath))
      }
    }

    return diffs
  }

  if (left !== right) {
    diffs.push({
      path: path || '(root)',
      type: 'value_change',
      left,
      right,
    })
  }

  return diffs
}

export const formatJsonValue = (value: unknown) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }

  return String(value)
}
