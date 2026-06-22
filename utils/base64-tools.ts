/**
 * 文本转换为 Base64 (支持 UTF-8 字符)
 */
export function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  const binString = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binString)
}

/**
 * Base64 转换为文本 (支持 UTF-8 字符)
 */
export function base64ToString(b64: string): string {
  const binString = atob(b64)
  const bytes = Uint8Array.from(binString, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * 文件转换为 Base64 (包含 DataURL)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
}
