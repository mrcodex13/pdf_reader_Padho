import { PDFDocument, rgb } from 'pdf-lib'

export async function loadPdfDocument(url) {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return PDFDocument.load(arrayBuffer)
}

/**
 * Adds a blank page after the given page index (0-based)
 * Returns a new blob URL for the modified PDF
 */
export async function addBlankPageAfter(fileUrl, afterPageIndex) {
  const pdfDoc = await loadPdfDocument(fileUrl)
  const pages = pdfDoc.getPages()

  // Get dimensions of the current page to match size
  const refPage = pages[Math.min(afterPageIndex, pages.length - 1)]
  const { width, height } = refPage.getSize()

  // Insert blank page after the given index
  const newPage = pdfDoc.insertPage(afterPageIndex + 1, [width, height])

  // Add a subtle "blank page" watermark so you know it's new
  newPage.drawText('', { x: 0, y: 0, size: 1, color: rgb(1, 1, 1) })

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

/**
 * Merges fabric.js canvas annotations into the PDF and triggers download.
 * @param {string} fileUrl - URL of the PDF (blob or http)
 * @param {object} fabricCanvas - Fabric.js canvas with annotations
 * @param {string} fileName - base name for download
 * @param {number} pageIndex - 0-based page number to draw annotations on (default 0)
 */
export async function savePdfWithAnnotations(fileUrl, fabricCanvas, fileName = 'annotated', pageIndex = 0) {
  try {
    const pdfDoc = await loadPdfDocument(fileUrl)
    const pages = pdfDoc.getPages()
    if (pages.length === 0) throw new Error('PDF has no pages')

    const canvasDataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 })
    const base64 = canvasDataUrl.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const pngImage = await pdfDoc.embedPng(bytes)
    const page = pages[Math.min(pageIndex, pages.length - 1)]
    const { width, height } = page.getSize()

    page.drawImage(pngImage, { x: 0, y: 0, width, height })

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}-annotated.pdf`
    link.click()
    URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.error('Save PDF error:', err)
    throw err
  }
}

export function getPageDimensions(page) {
  if (!page) return { width: 612, height: 792 }
  return { width: page.width, height: page.height }
}