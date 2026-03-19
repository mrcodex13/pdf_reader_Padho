import { Link } from 'react-router-dom'
import { Search, User, BookOpen, LogOut, X } from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import { useBookStore } from '../store/useBookStore'

export default function Navbar() {
  const user = useUserStore((s) => s.user)
  const logout = useUserStore((s) => s.logout)
  const searchQuery = useBookStore((s) => s.searchQuery)
  const setSearchQuery = useBookStore((s) => s.setSearchQuery)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-heading hidden sm:inline">
              PadhoPadho
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="search"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-card text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted hover:bg-card hover:text-body transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <Link
              to="/"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary overflow-hidden border border-border hover:bg-primary/20 transition-colors"
              title={user?.name}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>
          </div>

        </div>
      </div>
    </header>
  )
}