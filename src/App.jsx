import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
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
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    const { error } = await logout()
    if (!error) {
      navigate('/login', { replace: true })
    }
  }

  return (
    <nav style={{
      display: 'flex', gap: 16, padding: '1rem',
      borderBottom: '0.5px solid var(--color-border-tertiary)'
    }}>
      <Link to="/partidos">⚽ Partidos</Link>
      <Link to="/ranking">🏆 Ranking</Link>
      {!user
        ? <Link to="/login" style={{ marginLeft: 'auto' }}>Ingresar</Link>
        : <button
            type="button"
            onClick={handleLogout}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
              textDecoration: 'underline'
            }}
          >
            {`${user.user_metadata?.username ?? 'Usuario'} Cerrar sesión`}
          </button>
      }
    </nav>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/partidos" element={<PrivateRoute><Matches /></PrivateRoute>} />
          <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/partidos" />} />
        </Routes>
        <Footer />
      </HashRouter>
    </AuthProvider>
  )
}