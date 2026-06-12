import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Ranking from './pages/Ranking'
import ElijoCreer from './pages/ElijoCreer'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import Footer from './components/Footer'
import logo from './assets/idLogoAzul@2x.webp'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-base text-slate-500 shadow-sm">
          Cargando...
        </p>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" />
}

function Navbar() {
  const { user } = useAuth()

  const linkClassName = ({ isActive }) => [
    'rounded-full px-2 py-1.5 text-xs font-bold transition-colors sm:px-4 sm:py-2 sm:text-sm lg:px-5 lg:text-base',
    isActive
      ? 'bg-primary-500 text-white shadow-sm'
      : 'text-primary-600 hover:bg-primary-50 hover:text-primary-950',
  ].join(' ')

  return (
    <header className="sticky top-0 z-20 border-b border-primary-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto w-full max-w-4xl px-4 py-1.5 sm:px-6 md:hidden">
        <div className="relative flex items-center justify-center mb-1">
          <div className="absolute left-0">
            {!user ? (
              <NavLink to="/login" className={linkClassName({ isActive: false })}>
                Ingresar
              </NavLink>
            ) : (
              <NavLink to="/perfil" className={`${linkClassName({ isActive: false })} max-w-[7rem] truncate`}>
                Mi perfil
              </NavLink>
            )}
          </div>
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>
        <div className="flex items-center justify-center gap-1 sm:gap-1.5">
          <NavLink to="/partidos" className={linkClassName}>
            ⚽ Partidos
          </NavLink>
          <NavLink to="/ranking" className={linkClassName}>
            🏆 Ranking
          </NavLink>
          <NavLink to="/elijo-creer" className={linkClassName}>
            🔥 Elijo creer
          </NavLink>
        </div>
      </nav>

      <nav className="mx-auto hidden w-full max-w-4xl items-center gap-2 px-4 py-1.5 md:flex lg:px-8">
        <div className="flex items-center gap-1.5 lg:gap-2">
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
            <NavLink to="/login" className={linkClassName({ isActive: false })}>
              Ingresar
            </NavLink>
          ) : (
            <NavLink to="/perfil" className={`${linkClassName({ isActive: false })} max-w-[10rem] truncate`}>
              Mi perfil
            </NavLink>
          )}
        </div>

        <div id="logo" className="ml-auto shrink-0">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </div>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/partidos" element={<PrivateRoute><Matches /></PrivateRoute>} />
              <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
              <Route path="/elijo-creer" element={<PrivateRoute><ElijoCreer /></PrivateRoute>} />
              <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/partidos" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AuthProvider>
  )
}