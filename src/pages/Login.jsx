import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, BookOpen } from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import { lsGet } from '../utils/localDb'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setUser = useUserStore((s) => s.setUser)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Load all registered users from localStorage
      const users = lsGet('padhoPadho_users') || []
      const found = users.find(
        (u) => u.email === email.trim().toLowerCase() && u.password === password
      )

      if (!found) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      // Don't store password in active session
      const { password: _, ...safeUser } = found
      setUser(safeUser)
      navigate('/')
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-heading text-center mb-1">
            PadhoPadho
          </h1>
          <p className="text-primary text-center text-xs font-medium mb-2">पढ़ो, समझो, बढ़ो</p>
          <p className="text-muted text-center text-sm mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-body mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-muted text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}