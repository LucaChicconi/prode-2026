import { useEffect, useState } from 'react'
import { getMatches, getPredictions, getRanking } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

const topTenTeams = new Set([
  'francia',
  'españa',
  'argentina',
  'inglaterra',
  'portugal',
  'brasil',
  'paises bajos',
  'marruecos',
  'belgica',
  'alemania',
])

const lowerFifaTeams = new Set([
  'nueva zelanda',
  'haiti',
  'curazao',
  'ghana',
  'cabo verde',
  'bosnia y herzegovina',
  'jordania',
  'arabia saudita',
  'sudafrica',
  'irak',
  'qatar',
  'uzbekistan',
  'rd congo',
  'tunez',
  'escocia',
])

function normalizeTeamName(team) {
  return (team ?? '')
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getMatchKey(match) {
  return match.match_id ?? match.id
}

function isPossibleBatacazo(match) {
  const homeTeam = normalizeTeamName(match.home_team)
  const awayTeam = normalizeTeamName(match.away_team)

  const homeIsLow = lowerFifaTeams.has(homeTeam)
  const awayIsLow = lowerFifaTeams.has(awayTeam)
  const homeIsTop = topTenTeams.has(homeTeam)
  const awayIsTop = topTenTeams.has(awayTeam)

  if (!((homeIsLow && awayIsTop) || (awayIsLow && homeIsTop))) {
    return false
  }

  const homeScore = Number(match.home_score)
  const awayScore = Number(match.away_score)

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return false
  }

  const lowTeamScore = homeIsLow ? homeScore : awayScore
  const topTeamScore = homeIsLow ? awayScore : homeScore

  return lowTeamScore >= topTeamScore
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
      const matchesByKey = new Map(
        (matchesResult.data || []).map(match => [getMatchKey(match), match])
      )

      const bonusByUsername = new Map()

      ;(predictionsResult.data || []).forEach(prediction => {
        const matchKey = getPredictionKey(prediction)
        const match = matchesByKey.get(matchKey)

        if (!match || !isPossibleBatacazo(match)) {
          return
        }

        const predictionHome = Number(prediction.home_score_pred)
        const predictionAway = Number(prediction.away_score_pred)
        const matchHome = Number(match.home_score)
        const matchAway = Number(match.away_score)

        if (
          Number.isNaN(predictionHome) ||
          Number.isNaN(predictionAway) ||
          Number.isNaN(matchHome) ||
          Number.isNaN(matchAway)
        ) {
          return
        }

        if (predictionHome === matchHome && predictionAway === matchAway) {
          const username = prediction.profiles?.username
          if (!username) return

          bonusByUsername.set(username, (bonusByUsername.get(username) || 0) + 5)
        }
      })

      const rankingWithBonus = rankingData
        .map(profile => {
          const batacazoBonus = bonusByUsername.get(profile.username) || 0
          const totalPoints = Number(profile.total_points || 0)

          return {
            ...profile,
            batacazoBonus,
            displayPoints: totalPoints + batacazoBonus,
          }
        })
        .sort((a, b) => {
          if (b.displayPoints !== a.displayPoints) {
            return b.displayPoints - a.displayPoints
          }

          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points
          }

          return a.username.localeCompare(b.username)
        })

      const hoyLaVieron = rankingWithBonus
        .filter(profile => profile.batacazoBonus > 0)
        .map(profile => profile.username)

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