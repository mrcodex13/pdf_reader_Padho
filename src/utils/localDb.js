// localDb.js — replaces supabaseClient.js
// Uses IndexedDB for PDF file storage, localStorage for everything else

const DB_NAME = 'padhoPadhoDB'
const DB_VERSION = 1
const STORE_NAME = 'pdfs'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

// Save a PDF File object to IndexedDB, returns a key
export async function savePdfToIndexedDB(key, file) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(file, key)
    tx.oncomplete = () => resolve(key)
    tx.onerror = (e) => reject(e.target.error)
  })
}

// Load a PDF from IndexedDB by key, returns a blob URL
export async function loadPdfFromIndexedDB(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = (e) => {
      const file = e.target.result
      if (!file) return resolve(null)
      resolve(URL.createObjectURL(file))
    }
    req.onerror = (e) => reject(e.target.error)
  })
}

// Delete a PDF from IndexedDB
export async function deletePdfFromIndexedDB(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

// ── localStorage helpers ──────────────────────────────────────────────────────

export function lsGet(key) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : null
  } catch { return null }
}

export function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function lsRemove(key) {
  localStorage.removeItem(key)
}