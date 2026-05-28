import { useEffect, useState } from 'react'
import { getMatches, savePrediction, getMyPredictions } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [saved, setSaved] = useState({})

  useEffect(() => {
    getMatches().then(({ data }) => setMatches(data || []))
    if (user) {
      getMyPredictions(user.id).then(({ data }) => {
        const map = {}
        data?.forEach(p => {
          map[p.match_id] = {
            home: p.home_score_pred,
            away: p.away_score_pred
          }
        })
        setPredictions(map)
      })
    }
  }, [user])

  function isMatchStarted(matchTime) {
    return new Date(matchTime) < new Date()
  }

  async function handleSave(matchId) {
    const pred = predictions[matchId]
    if (!pred) return
    const { error } = await savePrediction(
      user.id, matchId, pred.home, pred.away
    )
    if (!error) setSaved(s => ({ ...s, [matchId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
  }

  function updatePred(matchId, team, value) {
    setPredictions(p => ({
      ...p,
      [matchId]: { ...p[matchId], [team]: Number(value) }
    }))
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2>Partidos</h2>
      {matches.map(match => {
        const started = isMatchStarted(match.match_time)
        const pred = predictions[match.match_id] || { home: 0, away: 0 }
        return (
          <div key={match.id} style={{
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1rem',
            marginBottom: '1rem',
            background: 'var(--color-background-primary)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {new Date(match.match_time).toLocaleString('es-AR')} — {match.stage}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>
                {match.home_team}
              </span>
              <input type="number" min="0" max="20"
                disabled={started || !user}
                value={pred.home ?? 0}
                onChange={e => updatePred(match.id, 'home', e.target.value)}
                style={{ width: 48, textAlign: 'center' }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
              <input type="number" min="0" max="20"
                disabled={started || !user}
                value={pred.away ?? 0}
                onChange={e => updatePred(match.id, 'away', e.target.value)}
                style={{ width: 48, textAlign: 'center' }}
              />
              <span style={{ flex: 1, fontWeight: 500 }}>
                {match.away_team}
              </span>
              <button
                disabled={started || !user}
                onClick={() => handleSave(match.id)}
                style={{ minWidth: 80 }}
              >
                {saved[match.id] ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
            {started && match.home_score !== null && (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Resultado: {match.home_score} - {match.away_score}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}