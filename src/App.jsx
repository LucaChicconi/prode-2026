import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Ranking from './pages/Ranking'
import Footer from './components/Footer'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p>Cargando...</p>
  return user ? children : <Navigate to="/login" />
}

function Navbar() {
  const { user } = useAuth()
  return (
    <nav style={{
      display: 'flex', gap: 16, padding: '1rem',
      borderBottom: '0.5px solid var(--color-border-tertiary)'
    }}>
      <Link to="/partidos">⚽ Partidos</Link>
      <Link to="/ranking">🏆 Ranking</Link>
      {!user
        ? <Link to="/login" style={{ marginLeft: 'auto' }}>Ingresar</Link>
        : <Link to="/login" style={{ marginLeft: 'auto' }}>
            {user.user_metadata?.username}
          </Link>
      }
    </nav>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/partidos" element={<PrivateRoute><Matches /></PrivateRoute>} />
          <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/partidos" />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}