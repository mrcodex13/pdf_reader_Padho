import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, BookOpen, ImagePlus } from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import { lsGet, lsSet } from '../utils/localDb'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setUser = useUserStore((s) => s.setUser)
  const navigate = useNavigate()

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result)
      setAvatarDataUrl(ev.target.result) // store as base64 in localStorage
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const users = lsGet('padhoPadho_users') || []

      // Check if email already exists
      const exists = users.find((u) => u.email === email.trim().toLowerCase())
      if (exists) {
        setError('An account with this email already exists.')
        setLoading(false)
        return
      }

      const newUser = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password, // stored locally — fine for a local-only app
        avatarUrl: avatarDataUrl || null,
      }

      // Save to users list
      lsSet('padhoPadho_users', [...users, newUser])

      // Log in immediately (without password)
      const { password: _, ...safeUser } = newUser
      setUser(safeUser)
      navigate('/')
    } catch (err) {
      setError('Signup failed. Please try again.')
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
          <h1 className="font-heading text-2xl font-semibold text-heading text-center mb-1">PadhoPadho</h1>
          <p className="text-primary text-center text-xs font-medium mb-2">पढ़ो, समझो, बढ़ो</p>
          <p className="text-muted text-center text-sm mb-8">Create your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-body mb-2">Profile picture (optional)</label>
              <div className="flex items-center gap-4">
                <label className="w-16 h-16 rounded-full bg-border flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-muted hover:border-primary transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-6 h-6 text-muted" />
                  )}
                </label>
                <span className="text-sm text-muted">Click to upload</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-70">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}