import { useEffect, useState } from 'react'
import { getRanking } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Ranking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadRanking() {
      setLoading(true)

      const rankingResult = await getRanking()

      if (!active) return

      setRanking(rankingResult.data || [])
      setLoading(false)
    }

    loadRanking()

    return () => {
      active = false
    }
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const panelClass = 'rounded-2xl border border-primary-200 bg-white p-2 shadow-sm sm:p-3'

  return (
    <section className="mx-auto w-full max-w-3xl space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-200 sm:text-base sm:tracking-[0.24em]">Tabla general</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ranking total</h1>
      </div>

      {loading && <p className="text-base text-primary-200">Cargando ranking...</p>}

      {ranking.map((profile, index) => (
        <div
          key={profile.username}
          className={`flex items-center gap-2 sm:gap-3 ${panelClass} ${profile.username === user?.user_metadata?.username ? 'ring-1 ring-primary-300' : ''}`}
        >
          <span className="w-7 shrink-0 text-center text-sm font-semibold text-primary-500 sm:w-8 sm:text-base">
            {medals[index] ?? index + 1}
          </span>
          <span className={`min-w-0 flex-1 truncate text-base ${profile.username === user?.user_metadata?.username ? 'font-medium text-primary-950' : 'text-primary-700'}`}>
            {profile.username}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary-900 sm:gap-2 sm:text-base">
            <span>{profile.total_points} pts</span>
          </span>
        </div>
      ))}

      {!loading && ranking.length === 0 && (
        <p className="text-base text-primary-500">Aún no hay puntos cargados.</p>
      )}

      <div className={panelClass}>
        <div className="mb-2 text-base font-semibold text-primary-900">¿Cómo se suman puntos?</div>
        <p className="text-base leading-6 text-primary-500">
          + 3 puntos por acertar el equipo ganador.<br />
          + 6 por acertar los goles (sin contar penales).<br />
          + 10 si acertás los penales.

          <p>No se acumulan, o sumás 3 o sumás 6 o sumás 10 por partido.</p>
        </p>
      </div>

    </section>
  )
}