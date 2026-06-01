import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getElijoCreerSelection, getMyProfile } from '../lib/db'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [selection, setSelection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!user) {
        setProfile(null)
        setSelection(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const [profileResult, selectionResult] = await Promise.all([
        getMyProfile(user.id),
        getElijoCreerSelection(user.id),
      ])

      if (!active) return

      if (profileResult.error) {
        setError(profileResult.error.message || 'No se pudo cargar tu perfil.')
      }

      setProfile(profileResult.data ?? null)
      setSelection(selectionResult.data ?? null)
      setLoading(false)
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [user])

  async function handleLogout() {
    setIsLoggingOut(true)
    const { error: logoutError } = await logout()

    if (!logoutError) {
      navigate('/login', { replace: true })
    }

    setIsLoggingOut(false)
  }

  const displayName = profile?.username ?? user?.user_metadata?.username ?? 'Usuario'
  const totalPoints = profile?.total_points ?? 0
  const selectedTeam = selection?.team
  const selectedPhase = selection?.phase
  const panelClass = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm sm:p-8">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Tu perfil</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Acá ves tus puntos acumulados y la apuesta que dejaste en Elijo creer.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando perfil...</p>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      {!loading ? (
        <div className={panelClass}>
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Tu nombre</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{displayName}</div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-500">Puntos</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{totalPoints}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-500">Elijo creer</div>
              <div className="mt-2 text-base font-medium text-slate-950">
                {selectedTeam ? selectedTeam : 'No elegiste un equipo todavía'}
              </div>
              {selectedPhase ? (
                <div className="mt-1 text-sm text-slate-500">
                  {`Llega hasta ${selectedPhase}`}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}