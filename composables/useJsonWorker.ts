import JsonWorker from '~/workers/json.worker.ts?worker'

let worker: Worker | null = null
let currentId = 0
const callbacks = new Map<number, { resolve: Function, reject: Function }>()

export const useJsonWorker = () => {
  if (process.client && !worker) {
    worker = new JsonWorker()
    worker.onmessage = (e) => {
      const { id, success, result, error } = e.data
      const cb = callbacks.get(id)
      if (cb) {
        if (success) {
          cb.resolve(result)
        } else {
          cb.reject(new Error(error))
        }
        callbacks.delete(id)
      }
    }
    worker.onerror = (e) => {
      const err = new Error(e.message || 'Worker 运行异常')
      callbacks.forEach(cb => cb.reject(err))
      callbacks.clear()
    }
  }

  const parseJson = async (jsonStr: string, autoFix = false) => {
    if (!worker) throw new Error('Worker not available')
    const id = ++currentId
    return new Promise<any>((resolve, reject) => {
      callbacks.set(id, { resolve, reject })
      worker!.postMessage({ id, type: 'parse', payload: { jsonStr, autoFix } })
    })
  }

  const compareJson = async (leftStr: string, rightStr: string) => {
    if (!worker) throw new Error('Worker not available')
    const id = ++currentId
    return new Promise<any>((resolve, reject) => {
      callbacks.set(id, { resolve, reject })
      worker!.postMessage({ id, type: 'compare', payload: { leftStr, rightStr } })
    })
  }

  return { parseJson, compareJson }
}
