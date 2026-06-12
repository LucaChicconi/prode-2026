import { useEffect, useState } from 'react'
import { getHoyLaVieron, getRanking } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Ranking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [batacazoUsers, setBatacazoUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadRanking() {
      setLoading(true)

      const [rankingResult, hoyLaVieronResult] = await Promise.all([
        getRanking(),
        getHoyLaVieron(),
      ])

      if (!active) return

      const rankingData = rankingResult.data || []

      setRanking(rankingData)

      if (hoyLaVieronResult.error) {
        console.error('Error loading hoy la vieron:', hoyLaVieronResult.error)
        setBatacazoUsers([])
      } else {
        setBatacazoUsers((hoyLaVieronResult.data || []).map(row => row.username))
      }
      setLoading(false)
    }

    loadRanking()

    return () => {
      active = false
    }
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const panelClass = 'rounded-2xl border border-primary-200 bg-white p-3 shadow-sm sm:p-4'
  const pillClass = 'rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 sm:text-sm'

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-200 sm:text-sm sm:tracking-[0.24em]">Tabla general</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ranking total</h1>
      </div>

      {loading && <p className="text-sm text-primary-200">Cargando ranking...</p>}

      {ranking.map((profile, index) => (
        <div
          key={profile.username}
          className={`flex items-center gap-2 sm:gap-3 ${panelClass} ${profile.username === user?.user_metadata?.username ? 'ring-1 ring-primary-300' : ''}`}
        >
          <span className="w-7 shrink-0 text-center text-xs font-semibold text-primary-500 sm:w-8 sm:text-sm">
            {medals[index] ?? index + 1}
          </span>
          <span className={`min-w-0 flex-1 truncate text-sm ${profile.username === user?.user_metadata?.username ? 'font-medium text-primary-950' : 'text-primary-700'}`}>
            {profile.username}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary-900 sm:gap-2 sm:text-sm">
            <span>{profile.total_points} pts</span>
            {batacazoUsers.includes(profile.username) ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Batacazo!
              </span>
            ) : null}
          </span>
        </div>
      ))}

      {!loading && ranking.length === 0 && (
        <p className="text-sm text-primary-500">Aún no hay puntos cargados.</p>
      )}

      <div className={panelClass}>
        <div className="mb-2 text-sm font-semibold text-primary-900">Posible batacazo</div>
        <p className="text-sm leading-6 text-primary-500 break-words">
          Si uno de los 15 equipos de ranking FIFA más bajo le empata o le gana a uno del top 10,
          ese partido queda marcado como posible batacazo. Si lo acertás exacto,
          sumás 5 puntos extra y entrás en &quot;Hoy la vieron&quot;.
        </p>
      </div>

      <div className={panelClass}>
        <div className="mb-3 text-sm font-semibold text-primary-900">Hoy la vieron</div>
        {batacazoUsers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {batacazoUsers.map(username => (
              <span key={username} className={pillClass}>
                {username}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-primary-500">Todavía nadie acertó un batacazo.</p>
        )}
      </div>
    </section>
  )
}