import MarkdownWorker from '~/workers/markdown.worker.ts?worker'

let worker: Worker | null = null
let currentId = 0
const callbacks = new Map<number, { resolve: Function, reject: Function }>()

export const useMarkdownWorker = () => {
  if (process.client && !worker) {
    worker = new MarkdownWorker()
    worker.onmessage = (e) => {
      const { id, success, html, error } = e.data
      const cb = callbacks.get(id)
      if (cb) {
        if (success) {
          cb.resolve(html)
        } else {
          cb.reject(new Error(error))
        }
        callbacks.delete(id)
      }
    }
  }

  const renderMarkdown = async (content: string) => {
    if (!worker) throw new Error('Worker not available')
    const id = ++currentId
    return new Promise<string>((resolve, reject) => {
      callbacks.set(id, { resolve, reject })
      worker!.postMessage({ id, content })
    })
  }

  return { renderMarkdown }
}
