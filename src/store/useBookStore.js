import { create } from 'zustand'
import { lsGet, lsSet } from '../utils/localDb'

const BOOKS_KEY = 'padhoPadho_books'
const BOOKMARKS_KEY = 'padhoPadho_bookmarks'
const HIGHLIGHTS_KEY = 'padhoPadho_highlights'

const initialBooks = () => lsGet(BOOKS_KEY) ?? []
const initialBookmarks = () => lsGet(BOOKMARKS_KEY) ?? {}
const initialHighlights = () => lsGet(HIGHLIGHTS_KEY) ?? {}

export const useBookStore = create((set, get) => ({
  books: initialBooks(),
  currentBook: null,
  bookmarks: initialBookmarks(),
  highlights: initialHighlights(),
  searchQuery: '',

  setSearchQuery: (q) => set({ searchQuery: q }),

  filteredBooks: () => {
    const { books, searchQuery } = get()
    if (!searchQuery.trim()) return books
    const q = searchQuery.toLowerCase()
    return books.filter((b) => b.title.toLowerCase().includes(q))
  },

  setCurrentBook: (book) => set({ currentBook: book }),
  setBooks: (books) => {
    set({ books })
    lsSet(BOOKS_KEY, books)
  },
  addBook: (book) => {
    set((s) => {
      const next = [book, ...s.books]
      lsSet(BOOKS_KEY, next)
      return { books: next }
    })
  },
  updateBookProgress: (bookId, progress, currentPage) => {
    set((s) => {
      const books = s.books.map((b) =>
        b.id === bookId
          ? { ...b, progress, currentPage, lastOpened: new Date().toISOString().slice(0, 10) }
          : b
      )
      lsSet(BOOKS_KEY, books)
      return { books }
    })
  },
  removeBook: (bookId) => {
    set((s) => {
      const books = s.books.filter((b) => b.id !== bookId)
      lsSet(BOOKS_KEY, books)
      return { books }
    })
  },
  toggleBookmark: (bookId, pageNumber) => {
    set((s) => {
      const key = `${bookId}-${pageNumber}`
      const next = { ...s.bookmarks, [key]: !s.bookmarks[key] }
      lsSet(BOOKMARKS_KEY, next)
      return { bookmarks: next }
    })
  },
  setHighlights: (bookId, highlights) => {
    set((s) => {
      const next = { ...s.highlights, [bookId]: highlights }
      lsSet(HIGHLIGHTS_KEY, next)
      return { highlights: next }
    })
  },
}))
