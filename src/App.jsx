import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Reader from './pages/Reader'
import { useUserStore } from './store/useUserStore'

function ProtectedRoute({ children }) {
  const user = useUserStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/reader/:bookId" element={<ProtectedRoute><Reader /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App