# PageMind – PDF Book Reader & Editor

A full-stack PDF book reader and editor web app with an AI chat panel. Built with React, Vite, Tailwind CSS, react-pdf, and Zustand.

## Tech Stack

- **React + Vite** – UI and build
- **Tailwind CSS** – Styling (Udemy-inspired theme)
- **React Router** – Navigation
- **Zustand** – State (user, books, chat)
- **react-pdf** – PDF rendering
- **pdf-lib** – PDF editing/saving (utils placeholder)
- **fabric** – Drawing/writing on PDF (ready for overlay)
- **Lucide React** – Icons
- **Recharts** – Progress charts (available for dashboard)

## Design

- Background: `#ffffff`
- Cards: `#f7f9fc`
- Primary: `#2d6be4`
- Headings: Poppins; body: DM Sans

## Scripts

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
npm run preview
```

## Pages

- **/login** – Email/password login
- **/signup** – Sign up with name, email, password, optional avatar
- **/** – Dashboard (My Library) with book grid and “Add Book”
- **/reader/:bookId** – Two-panel reader: PDF viewer + tools (left), AI chat (right)

## AI Chat (Gemini)

Chat panel has **Discuss** and **Explain** modes. API calls are placeholders in `src/utils/geminiApi.js`. To use the real Gemini API:

1. Add `VITE_GEMINI_API_KEY=your_key` to `.env`
2. Implement `sendChatMessage()` in `src/utils/geminiApi.js` with the Gemini API

## Project Structure

```
src/
  pages/       Login, Signup, Dashboard, Reader
  components/  Navbar, BookCard, PDFViewer, EditingToolbar, ChatPanel
  store/       useUserStore, useBookStore, useChatStore
  utils/       pdfUtils, geminiApi
```

Mock data is used throughout; ready for a Supabase (or other) backend later.
