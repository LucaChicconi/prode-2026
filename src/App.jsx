import { HashRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Ranking from './pages/Ranking'
import ElijoCreer from './pages/ElijoCreer'
import Footer from './components/Footer'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
          Cargando...
        </p>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" />
}

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const linkClassName = ({ isActive }) => [
    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ')

  async function handleLogout() {
    const { error } = await logout()
    if (!error) {
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/partidos" className={linkClassName}>
          ⚽ Partidos
        </NavLink>
        <NavLink to="/ranking" className={linkClassName}>
          🏆 Ranking
        </NavLink>
        <NavLink to="/elijo-creer" className={linkClassName}>
          🔥 Elijo creer
        </NavLink>
        {!user ? (
          <NavLink to="/login" className={`${linkClassName({ isActive: false })} ml-auto`}>
            Ingresar
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            {`${user.user_metadata?.username ?? 'Usuario'} · Cerrar sesión`}
          </button>
        )}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/partidos" element={<PrivateRoute><Matches /></PrivateRoute>} />
              <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
              <Route path="/elijo-creer" element={<PrivateRoute><ElijoCreer /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/partidos" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AuthProvider>
  )
}