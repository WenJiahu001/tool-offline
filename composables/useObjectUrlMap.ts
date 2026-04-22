import { onBeforeUnmount, reactive } from 'vue'

type ObjectUrlSource = Blob | File | null | undefined

export function useObjectUrlMap() {
  const urls = reactive<Record<string, string>>({})

  const revoke = (key: string) => {
    const current = urls[key]
    if (current) {
      URL.revokeObjectURL(current)
      delete urls[key]
    }
  }

  const set = (key: string, source: ObjectUrlSource) => {
    revoke(key)

    if (!source) {
      return ''
    }

    const next = URL.createObjectURL(source)
    urls[key] = next
    return next
  }

  const get = (key: string) => urls[key] || ''

  const clear = () => {
    Object.keys(urls).forEach(revoke)
  }

  onBeforeUnmount(clear)

  return {
    urls,
    get,
    set,
    revoke,
    clear,
  }
}
