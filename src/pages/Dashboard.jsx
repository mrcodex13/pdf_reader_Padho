import { useRef, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Plus, FileUp, Loader2, Trash2 } from 'lucide-react'
import { pdfjs } from 'react-pdf'
import Navbar from '../components/Navbar'
import ReadingStats from '../components/ReadingStats'
import { useBookStore } from '../store/useBookStore'
import { savePdfToIndexedDB, deletePdfFromIndexedDB } from '../utils/localDb'
import { PDFDocument } from 'pdf-lib'

export default function Dashboard() {
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const books = useBookStore((s) => s.books)
  const searchQuery = useBookStore((s) => s.searchQuery)
  const addBook = useBookStore((s) => s.addBook)
  const removeBook = useBookStore((s) => s.removeBook)
  const setCurrentBook = useBookStore((s) => s.setCurrentBook)
  const filteredBooks = useMemo(
    () =>
      !searchQuery.trim()
        ? books
        : books.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [books, searchQuery]
  )

  const handleAddPdf = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!file.type.includes('pdf')) {
      setUploadError('Please select a PDF file.')
      return
    }
    setUploadError('')
    setUploading(true)
    try {
      const id = `book_${Date.now()}`
      const idbKey = `pdf_${Date.now()}_${file.name}`
      await savePdfToIndexedDB(idbKey, file)

      const buf = await file.arrayBuffer()
      let totalPages = 1
      let coverUrl = null

      try {
        const doc = await PDFDocument.load(buf)
        totalPages = doc.getPageCount()
      } catch {
        // keep 1
      }

      try {
        const pdfDoc = await pdfjs.getDocument({ data: buf }).promise
        const page = await pdfDoc.getPage(1)
        const viewport = page.getViewport({ scale: 0.2 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise
        coverUrl = canvas.toDataURL('image/jpeg', 0.5)
      } catch {
        // no thumbnail
      }

      const title = file.name.replace(/\.pdf$/i, '').trim() || 'Untitled PDF'
      addBook({
        id,
        idbKey,
        title,
        coverUrl,
        fileUrl: null,
        progress: 0,
        lastOpened: new Date().toISOString().slice(0, 10),
        bookmarked: false,
        totalPages,
        currentPage: 1,
      })
    } catch (err) {
      console.error(err)
      setUploadError('Failed to add PDF. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (e, book) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Remove "${book.title}" from your library? The PDF will be deleted.`)) return
    setDeletingId(book.id)
    try {
      if (book.idbKey) await deletePdfFromIndexedDB(book.idbKey)
      removeBook(book.id)
      setCurrentBook(null)
      if (window.location.pathname === `/reader/${book.id}`) navigate('/')
    } catch (err) {
      console.error(err)
      setUploadError('Failed to remove PDF.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="font-heading text-2xl font-semibold text-heading">My Library</h1>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleAddPdf}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FileUp className="w-5 h-5" />
                  Add PDF
                </>
              )}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {uploadError}
          </div>
        )}

        {books.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-card">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-heading mb-2">No books yet</h2>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
              Add a PDF from your device to start reading. Everything is stored locally on your system.
            </p>
            <button
              type="button"
              onClick={handleAddPdf}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              <Plus className="w-5 h-5" />
              Add your first PDF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                to={`/reader/${book.id}`}
                className="relative block bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-panel transition-shadow"
              >
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, book)}
                  disabled={deletingId === book.id}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  title="Remove from library"
                  aria-label="Remove from library"
                >
                  {deletingId === book.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <div className="w-full aspect-[3/4] rounded-lg bg-border flex items-center justify-center mb-3 overflow-hidden">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-muted" />
                  )}
                </div>
                <h3 className="font-heading font-semibold text-heading truncate pr-8">{book.title}</h3>
                <p className="text-xs text-muted mt-1">
                  {book.totalPages || '?'} pages · {book.progress || 0}% read
                </p>
              </Link>
            ))}
          </div>
        )}

        <ReadingStats books={books} />
      </main>
    </div>
  )
}
