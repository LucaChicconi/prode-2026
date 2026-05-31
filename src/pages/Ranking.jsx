import { useEffect, useState } from 'react'
import { getMatches, getPredictions, getRanking } from '../lib/db'
import { calculateRankingWithBonus } from '../lib/ranking'
import { useAuth } from '../hooks/useAuth'

function getMatchKey(match) {
  return match.match_id ?? match.id
}

function getPredictionKey(prediction) {
  return prediction.match_id ?? prediction.matches?.id ?? prediction.matches?.match_id
}

export default function Ranking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [batacazoUsers, setBatacazoUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadRanking() {
      setLoading(true)

      const [rankingResult, matchesResult, predictionsResult] = await Promise.all([
        getRanking(),
        getMatches(),
        getPredictions(),
      ])

      if (!active) return

      const rankingData = rankingResult.data || []
      const { rankingWithBonus, hoyLaVieron } = calculateRankingWithBonus(
        rankingData,
        matchesResult.data || [],
        predictionsResult.data || []
      )

      setRanking(rankingWithBonus)
      setBatacazoUsers(hoyLaVieron)
      setLoading(false)
    }

    loadRanking()

    return () => {
      active = false
    }
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const panelClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
  const pillClass = 'rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700'

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Tabla general</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Ranking total</h1>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando ranking...</p>}

      {ranking.map((profile, index) => (
        <div
          key={profile.username}
          className={`flex items-center gap-3 ${panelClass} ${profile.username === user?.user_metadata?.username ? 'ring-1 ring-slate-300' : ''}`}
        >
          <span className="w-8 text-center text-sm font-semibold text-slate-500">
            {medals[index] ?? index + 1}
          </span>
          <span className={`flex-1 ${profile.username === user?.user_metadata?.username ? 'font-medium text-slate-950' : 'text-slate-700'}`}>
            {profile.username}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {profile.displayPoints} pts
            {profile.batacazoBonus > 0 ? ` +${profile.batacazoBonus}` : ''}
          </span>
        </div>
      ))}

      {!loading && ranking.length === 0 && (
        <p className="text-sm text-slate-500">Aún no hay puntos cargados.</p>
      )}

      <div className={panelClass}>
        <div className="mb-2 text-sm font-semibold text-slate-900">Posible batacazo</div>
        <p className="text-sm leading-6 text-slate-500">
          Si uno de los 15 equipos de ranking FIFA más bajo le empata o le gana a uno del top 10,
          ese partido queda marcado como posible batacazo. Si lo acertás exacto,
          sumás 5 puntos extra y entrás en &quot;Hoy la vieron&quot;.
        </p>
      </div>

      <div className={panelClass}>
        <div className="mb-3 text-sm font-semibold text-slate-900">Hoy la vieron</div>
        {batacazoUsers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {batacazoUsers.map(username => (
              <span key={username} className={pillClass}>
                {username}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Todavía nadie acertó un batacazo.</p>
        )}
      </div>
    </section>
  )
}