import { PDFDocument } from 'pdf-lib'

self.onmessage = async (e) => {
  const { type, payload, id } = e.data
  try {
    if (type === 'merge') {
      const mergedPdf = await PDFDocument.create()
      for (const buffer of payload.buffers) {
        const pdfDoc = await PDFDocument.load(buffer)
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }
      const pdfBytes = await mergedPdf.save()
      self.postMessage({ id, success: true, blob: pdfBytes }, [pdfBytes.buffer])
    } else if (type === 'imagesToPdf') {
      const pdfDoc = await PDFDocument.create()
      for (let i = 0; i < payload.buffers.length; i++) {
        const buffer = payload.buffers[i]
        const mimeType = payload.types[i]
        let image
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          image = await pdfDoc.embedJpg(buffer)
        } else {
          image = await pdfDoc.embedPng(buffer)
        }
        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
      }
      const pdfBytes = await pdfDoc.save()
      self.postMessage({ id, success: true, blob: pdfBytes }, [pdfBytes.buffer])
    }
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message })
  }
}

