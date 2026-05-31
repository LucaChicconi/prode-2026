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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2>Ranking total</h2>

      {loading && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando ranking...</p>
      )}

      {ranking.map((profile, i) => (
        <div key={profile.username} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0.75rem 1rem', marginBottom: 8,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-md)',
          fontWeight: profile.username === user?.user_metadata?.username ? 500 : 400
        }}>
          <span style={{ width: 28, textAlign: 'center' }}>
            {medals[i] ?? i + 1}
          </span>
          <span style={{ flex: 1 }}>{profile.username}</span>
          <span style={{ fontWeight: 500 }}>
            {profile.displayPoints} pts
            {profile.batacazoBonus > 0 ? ` +${profile.batacazoBonus}` : ''}
          </span>
        </div>
      ))}
      {!loading && ranking.length === 0 &&
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Aún no hay puntos cargados.
        </p>
      }

      <div style={{
        marginTop: 20,
        marginBottom: 16,
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Posible batacazo
        </div>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Si uno de los 15 equipos de ranking FIFA más bajo le empata o le gana a uno del top 10,
          ese partido queda marcado como posible batacazo. Si lo acertás exacto,
          sumás 5 puntos extra y entrás en &quot;Hoy la vieron&quot;.
        </p>
      </div>

      <div style={{
        marginBottom: 20,
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
          Hoy la vieron
        </div>
        {batacazoUsers.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {batacazoUsers.map(username => (
              <span
                key={username}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '999px',
                  border: '0.5px solid var(--color-border-tertiary)',
                  background: 'var(--color-background-secondary)',
                  fontWeight: 500,
                }}
              >
                {username}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            Todavía nadie acertó un batacazo.
          </p>
        )}
      </div>
    </div>
  )
}