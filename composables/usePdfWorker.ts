import PdfWorker from '~/workers/pdf.worker.ts?worker'
let worker: Worker | null = null
let currentId = 0
const callbacks = new Map<number, { resolve: Function, reject: Function }>()

export const usePdfWorker = () => {
  if (process.client && !worker) {
    worker = new PdfWorker()
    worker.onmessage = (e) => {
      const { id, success, blob, error } = e.data
      const cb = callbacks.get(id)
      if (cb) {
        if (success) {
          cb.resolve(blob)
        } else {
          cb.reject(new Error(error))
        }
        callbacks.delete(id)
      }
    }
  }

  const mergePdfs = async (files: File[]) => {
    if (!worker) throw new Error('Worker not available')
    const id = ++currentId
    return new Promise<Uint8Array>((resolve, reject) => {
      callbacks.set(id, { resolve, reject })
      Promise.all(files.map(f => f.arrayBuffer())).then(buffers => {
        worker!.postMessage({
          id,
          type: 'merge',
          payload: { buffers }
        }, buffers)
      }).catch(err => {
        callbacks.delete(id)
        reject(err)
      })
    })
  }

  const imagesToPdf = async (files: File[]) => {
    if (!worker) throw new Error('Worker not available')
    const id = ++currentId
    return new Promise<Uint8Array>((resolve, reject) => {
      callbacks.set(id, { resolve, reject })
      Promise.all(files.map(f => f.arrayBuffer())).then(buffers => {
        worker!.postMessage({
          id,
          type: 'imagesToPdf',
          payload: { 
            buffers, 
            types: files.map(f => f.type)
          }
        }, buffers)
      }).catch(err => {
        callbacks.delete(id)
        reject(err)
      })
    })
  }

  return { mergePdfs, imagesToPdf }
}

