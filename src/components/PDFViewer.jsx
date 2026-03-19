import { useState, useCallback, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as fabric from 'fabric'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use CDN worker so version matches react-pdf's bundled pdfjs (avoids Vite worker path issues)
if (typeof pdfjs !== 'undefined' && pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

export default function PDFViewer({
  fileUrl,
  currentPage,
  onPageChange,
  scale = 1.2,
  activeTool = 'select',
  onCanvasReady,
  onHistoryChange,
  viewMode = 'page',
}) {
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(currentPage || 1)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const canvasElRef = useRef(null)
  const fabricRef = useRef(null)
  const historyRef = useRef({ stack: [], index: -1 })

  // ─── Page load ───────────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n)
    setPageNumber((p) => Math.min(p, n))
  }, [])

  useEffect(() => {
    if (currentPage && currentPage !== pageNumber) setPageNumber(currentPage)
  }, [currentPage])

  useEffect(() => {
    onPageChange?.(pageNumber)
  }, [pageNumber, onPageChange])

  // ─── Init Fabric canvas once page size is known ──────────────
  useEffect(() => {
    if (!pageSize.width || !canvasElRef.current) return

    // Destroy old canvas if exists
    if (fabricRef.current) {
      fabricRef.current.dispose()
      fabricRef.current = null
    }

    const fc = new fabric.Canvas(canvasElRef.current, {
      width: pageSize.width,
      height: pageSize.height,
      isDrawingMode: false,
      selection: true,
    })

    fabricRef.current = fc

    // History helpers
    const saveState = () => {
      const json = JSON.stringify(fc.toJSON())
      const h = historyRef.current
      // Remove any redo states
      h.stack = h.stack.slice(0, h.index + 1)
      h.stack.push(json)
      h.index = h.stack.length - 1
      onHistoryChange?.({ canUndo: h.index > 0, canRedo: false })
    }

    fc.on('object:added', saveState)
    fc.on('object:modified', saveState)
    fc.on('object:removed', saveState)

    // Save initial empty state
    historyRef.current = { stack: [JSON.stringify(fc.toJSON())], index: 0 }

    onCanvasReady?.({
      undo: () => {
        const h = historyRef.current
        if (h.index <= 0) return
        h.index -= 1
        fc.loadFromJSON(JSON.parse(h.stack[h.index]), () => fc.renderAll())
        onHistoryChange?.({ canUndo: h.index > 0, canRedo: h.index < h.stack.length - 1 })
      },
      redo: () => {
        const h = historyRef.current
        if (h.index >= h.stack.length - 1) return
        h.index += 1
        fc.loadFromJSON(JSON.parse(h.stack[h.index]), () => fc.renderAll())
        onHistoryChange?.({ canUndo: h.index > 0, canRedo: h.index < h.stack.length - 1 })
      },
      getCanvas: () => fc,
      hasAnnotations: () => fc.getObjects().length > 0,
    })

    return () => {
      fc.dispose()
      fabricRef.current = null
    }
  }, [pageSize.width, pageSize.height, pageNumber])

  // ─── React to tool changes ────────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc) return

    // Reset all modes
    fc.isDrawingMode = false
    fc.selection = true
    fc.defaultCursor = 'default'
    fc.getObjects().forEach((o) => o.set({ selectable: true, evented: true }))

    if (activeTool === 'draw') {
      fc.isDrawingMode = true
      fc.freeDrawingBrush = new fabric.PencilBrush(fc)
      fc.freeDrawingBrush.color = '#e74c3c'
      fc.freeDrawingBrush.width = 3
    }

    else if (activeTool === 'text') {
      fc.defaultCursor = 'text'
      fc.selection = false
      fc.getObjects().forEach((o) => o.set({ selectable: false, evented: false }))

      const handleTextClick = (opt) => {
        const pointer = fc.getPointer(opt.e)
        const text = new fabric.IText('Type here...', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 16,
          fill: '#1c1d1f',
          fontFamily: 'DM Sans, sans-serif',
          editable: true,
        })
        fc.add(text)
        fc.setActiveObject(text)
        text.enterEditing()
        text.selectAll()
        // Remove listener after placing one text
        fc.off('mouse:down', handleTextClick)
        fc.selection = true
        fc.getObjects().forEach((o) => o.set({ selectable: true, evented: true }))
      }
      fc.on('mouse:down', handleTextClick)
    }

    else if (activeTool === 'highlight') {
      fc.selection = false
      fc.defaultCursor = 'crosshair'
      fc.getObjects().forEach((o) => o.set({ selectable: false, evented: false }))

      let startPoint = null
      let highlightRect = null

      const onMouseDown = (opt) => {
        startPoint = fc.getPointer(opt.e)
        highlightRect = new fabric.Rect({
          left: startPoint.x,
          top: startPoint.y,
          width: 0,
          height: 20,
          fill: 'rgba(255, 235, 59, 0.4)',
          stroke: 'rgba(255, 200, 0, 0.6)',
          strokeWidth: 1,
          selectable: true,
          evented: true,
        })
        fc.add(highlightRect)
      }

      const onMouseMove = (opt) => {
        if (!startPoint || !highlightRect) return
        const pointer = fc.getPointer(opt.e)
        const width = pointer.x - startPoint.x
        highlightRect.set({ width: Math.max(10, width) })
        fc.renderAll()
      }

      const onMouseUp = () => {
        startPoint = null
        highlightRect = null
        /* Keep handlers attached so user can draw multiple highlights without re-selecting tool */
      }

      fc.on('mouse:down', onMouseDown)
      fc.on('mouse:move', onMouseMove)
      fc.on('mouse:up', onMouseUp)
    }

    else if (activeTool === 'image') {
      // Trigger file input for image upload
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        fabric.Image.fromURL(url, (img) => {
          img.scaleToWidth(Math.min(200, fc.width / 2))
          img.set({ left: 50, top: 50 })
          fc.add(img)
          fc.setActiveObject(img)
          fc.renderAll()
        })
      }
      input.click()
    }

    else if (activeTool === 'select') {
      fc.selection = true
      fc.getObjects().forEach((o) => o.set({ selectable: true, evented: true }))
    }

    fc.renderAll()
  }, [activeTool])

  // ─── Capture page dimensions after render ────────────────────
  const handlePageRenderSuccess = useCallback((page) => {
    const viewport = page.getViewport({ scale })
    setPageSize({ width: viewport.width, height: viewport.height })
  }, [scale])

  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1))
  const goNext = () => setPageNumber((p) => Math.min(numPages, p + 1))

  const handlePageInput = (e) => {
    const v = parseInt(e.target.value, 10)
    if (!Number.isNaN(v)) setPageNumber(Math.max(1, Math.min(numPages, v)))
  }

  if (!fileUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center text-muted p-8">
          <p className="font-medium">No PDF loaded</p>
          <p className="text-sm mt-1">Open a book from your library to read.</p>
        </div>
      </div>
    )
  }

  const isScrollMode = viewMode === 'scroll'

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-auto bg-card p-4 ${isScrollMode ? '' : 'flex justify-center'}`}>
        <div className={isScrollMode ? 'flex flex-col items-center gap-4' : 'relative inline-block'}>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-12 text-muted">
                Loading PDF...
              </div>
            }
            error={
              <div className="flex items-center justify-center py-12 text-red-600">
                Failed to load PDF. Try another file.
              </div>
            }
          >
            {isScrollMode && numPages > 0 ? (
              Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                <Page
                  key={n}
                  pageNumber={n}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                  className="shadow-panel"
                />
              ))
            ) : (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-panel"
                onRenderSuccess={handlePageRenderSuccess}
              />
            )}
          </Document>
          {/* Fabric overlay: sibling of Document so it sits on top (page mode only) */}
          {!isScrollMode && pageSize.width > 0 && (
            <div
              className="absolute top-0 left-0"
              style={{
                width: pageSize.width,
                height: pageSize.height,
                zIndex: 10,
                pointerEvents: activeTool === 'select' ? 'none' : 'auto',
                cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'highlight' ? 'crosshair' : activeTool === 'text' ? 'text' : 'default',
              }}
            >
              <canvas ref={canvasElRef} style={{ display: 'block', pointerEvents: 'auto' }} />
            </div>
          )}
        </div>
      </div>

      {/* Page Controls - only in page mode */}
      {!isScrollMode && (
        <div className="flex items-center justify-center gap-2 py-2 border-t border-border bg-background">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg text-body hover:bg-card disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex items-center gap-2 text-sm text-body">
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={handlePageInput}
              className="w-14 text-center py-1 rounded border border-border bg-background text-body"
            />
            <span className="text-muted">/ {numPages || '–'}</span>
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-lg text-body hover:bg-card disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}