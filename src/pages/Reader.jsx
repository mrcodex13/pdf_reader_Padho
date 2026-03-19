import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, X, FileText, ScrollText } from 'lucide-react'
import EditingToolbar from '../components/EditingToolbar'
import PDFViewer from '../components/PDFViewer'
import ChatPanel from '../components/ChatPanel'
import { useBookStore } from '../store/useBookStore'
import { savePdfWithAnnotations, addBlankPageAfter } from '../utils/pdfUtils'
import { loadPdfFromIndexedDB } from '../utils/localDb'

export default function Reader() {
  const { bookId } = useParams()
  const books = useBookStore((s) => s.books)
  const setCurrentBook = useBookStore((s) => s.setCurrentBook)
  const updateBookProgress = useBookStore((s) => s.updateBookProgress)
  const toggleBookmark = useBookStore((s) => s.toggleBookmark)
  // Always resolve book from URL so the correct PDF opens when switching between books
  const book = books.find((b) => b.id === bookId) ?? null

  const [activeTool, setActiveTool] = useState('select')
  const [currentPage, setCurrentPage] = useState(book?.currentPage || 1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingPage, setAddingPage] = useState(false)
  const [showAddPageModal, setShowAddPageModal] = useState(false)
  const [fileUrl, setFileUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(true)
  const [viewMode, setViewMode] = useState('page')
  const canvasApiRef = useRef(null)
  const blobUrlRef = useRef(null)

  // Load PDF from IndexedDB on mount; revoke blob URL on cleanup
  useEffect(() => {
    if (book) setCurrentBook(book)

    const loadPdf = async () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
      setLoadingPdf(true)
      setFileUrl(null)
      try {
        if (book?.idbKey) {
          const url = await loadPdfFromIndexedDB(book.idbKey)
          if (url) {
            blobUrlRef.current = url
            setFileUrl(url)
          } else {
            alert('PDF not found in local storage. It may have been cleared.')
          }
        } else if (book?.fileUrl) {
          setFileUrl(book.fileUrl)
        }
      } catch (err) {
        console.error('Failed to load PDF:', err)
        alert('Failed to load PDF.')
      } finally {
        setLoadingPdf(false)
      }
    }

    if (book) loadPdf()
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [book?.id])

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page)
      if (book?.id) updateBookProgress(book.id, book.progress, page)
    },
    [book?.id, book?.progress, updateBookProgress]
  )

  const handleBookmark = () => {
    if (book?.id) toggleBookmark(book.id, currentPage)
  }

  const handleCanvasReady = useCallback((api) => {
    canvasApiRef.current = api
  }, [])

  const handleHistoryChange = useCallback(({ canUndo, canRedo }) => {
    setCanUndo(canUndo)
    setCanRedo(canRedo)
  }, [])

  const handleUndo = () => canvasApiRef.current?.undo()
  const handleRedo = () => canvasApiRef.current?.redo()

  const handleSave = async () => {
    const canvas = canvasApiRef.current?.getCanvas()
    if (!canvas) {
      alert('Nothing to save yet. Add some annotations first!')
      return
    }
    if (!canvasApiRef.current?.hasAnnotations()) {
      alert('No annotations found. Draw, highlight, or write something first!')
      return
    }
    setSaving(true)
    try {
      await savePdfWithAnnotations(fileUrl, canvas, book.title, currentPage - 1)
    } catch (err) {
      alert('Failed to save PDF. Make sure the PDF is loaded correctly.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPage = async () => {
    setShowAddPageModal(true)
  }

  const confirmAddPage = async () => {
    setShowAddPageModal(false)
    setAddingPage(true)
    try {
      const newUrl = await addBlankPageAfter(fileUrl, currentPage - 1)
      setFileUrl(newUrl)
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
        setAddingPage(false)
      }, 300)
    } catch (err) {
      alert('Failed to add page. Make sure a PDF is loaded.')
      setAddingPage(false)
    }
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted mb-4">Book not found.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0">
        <Link to="/" className="p-2 rounded-lg text-muted hover:bg-border hover:text-body transition-colors" title="Back to Library">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-heading font-semibold text-heading truncate flex-1">{book.title}</h1>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('page')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'page' ? 'bg-primary text-white' : 'text-muted hover:bg-border'}`}
            title="Page by page (editing)"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('scroll')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'scroll' ? 'bg-primary text-white' : 'text-muted hover:bg-border'}`}
            title="Scroll through PDF"
          >
            <ScrollText className="w-4 h-4" />
          </button>
        </div>
        {activeTool !== 'select' && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium capitalize">
            {activeTool} mode
          </span>
        )}
        {saving && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            Saving...
          </span>
        )}
        {addingPage && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            Adding page...
          </span>
        )}
        {loadingPdf && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
            Loading PDF...
          </span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        <div className="flex flex-col w-full md:w-[65%] min-w-0 border-b md:border-b-0 md:border-r border-border flex-1 min-h-[50%] md:min-h-0">
          <EditingToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onBookmark={handleBookmark}
            onAddPage={handleAddPage}
            onSave={handleSave}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            saving={saving}
          />
          <div
            className={`flex-1 min-h-0 relative ${viewMode === 'page' && activeTool !== 'select' ? 'reader-edit-mode' : ''}`}
          >
            {!loadingPdf && fileUrl ? (
              <PDFViewer
                fileUrl={fileUrl}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                activeTool={activeTool}
                onCanvasReady={handleCanvasReady}
                onHistoryChange={handleHistoryChange}
                viewMode={viewMode}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                {loadingPdf ? 'Loading PDF...' : 'No PDF available.'}
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-[35%] min-w-0 md:min-w-[280px] flex flex-col min-h-[40%] md:min-h-0">
          <ChatPanel />
        </div>
      </div>

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-heading text-lg">Add Blank Page</h2>
              <button
                onClick={() => setShowAddPageModal(false)}
                className="p-1 rounded-lg text-muted hover:bg-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-body text-sm mb-6">
              A blank page will be inserted <span className="font-medium text-heading">after page {currentPage}</span>. You can draw, write, or add images on it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddPageModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-body text-sm font-medium hover:bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddPage}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Add Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}