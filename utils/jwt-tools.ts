import { base64ToString } from './base64-tools'

/**
 * 解码 Base64Url 字符串
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return base64ToString(base64)
}

export interface JwtParsedResult {
  success: boolean
  header?: any
  payload?: any
  signature?: string
  error?: string
}

/**
 * 解析 JWT 字符串为 Header, Payload, Signature 结构
 */
export function parseJwt(token: string): JwtParsedResult {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return {
      success: false,
      error: 'JWT 格式错误，标准 JWT 应由两个“.”分隔为 Header、Payload、Signature 三部分。'
    }
  }

  try {
    const headerStr = base64UrlDecode(parts[0])
    const payloadStr = base64UrlDecode(parts[1])
    
    return {
      success: true,
      header: JSON.parse(headerStr),
      payload: JSON.parse(payloadStr),
      signature: parts[2]
    }
  } catch (e: any) {
    return {
      success: false,
      error: `解析失败: ${e.message || '数据结构不是有效的 JSON'}`
    }
  }
}
