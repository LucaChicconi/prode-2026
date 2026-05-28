import { useEffect, useState } from 'react'
import { getMatches, savePrediction, getMyPredictions, getPredictions } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [myPredictions, setMyPredictions] = useState({})
  const [predictionsByMatch, setPredictionsByMatch] = useState({})
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState({})
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoadError('')
      const [{ data: matchesData, error: matchesError }, { data: allPredictionsData, error: allPredictionsError }] = await Promise.all([
        getMatches(),
        getPredictions()
      ])

      if (matchesError || allPredictionsError) {
        setLoadError('No se pudieron cargar los partidos o las predicciones.')
      }

      setMatches(matchesData || [])

      const grouped = {}
      allPredictionsData?.forEach(prediction => {
        if (!grouped[prediction.match_id]) grouped[prediction.match_id] = []
        grouped[prediction.match_id].push({
          user_id: prediction.user_id,
          username: prediction.profiles?.username || 'Usuario',
          home: prediction.home_score_pred,
          away: prediction.away_score_pred,
        })
      })

      setPredictionsByMatch(grouped)

      if (user) {
        const { data: myPredictionsData } = await getMyPredictions(user.id)
        const own = {}
        myPredictionsData?.forEach(prediction => {
          own[prediction.match_id] = {
            home: prediction.home_score_pred,
            away: prediction.away_score_pred,
          }
        })
        setMyPredictions(own)
      }
    }

    loadData()
  }, [user])

  function isMatchStarted(matchTime) {
    return new Date(matchTime) < new Date()
  }

  async function handleSave(matchId) {
    const pred = myPredictions[matchId]
    if (!pred) return
    setSaving(s => ({ ...s, [matchId]: true }))
    const { error } = await savePrediction(
      user.id, matchId, pred.home, pred.away
    )
    setSaving(s => ({ ...s, [matchId]: false }))
    if (!error) {
      setSaved(s => ({ ...s, [matchId]: true }))
      const { data: refreshedOwn } = await getMyPredictions(user.id)
      const own = {}
      refreshedOwn?.forEach(prediction => {
        own[prediction.match_id] = {
          home: prediction.home_score_pred,
          away: prediction.away_score_pred,
        }
      })
      setMyPredictions(own)
      const { data } = await getPredictions()
      const grouped = {}
      data?.forEach(prediction => {
        if (!grouped[prediction.match_id]) grouped[prediction.match_id] = []
        grouped[prediction.match_id].push({
          user_id: prediction.user_id,
          username: prediction.profiles?.username || 'Usuario',
          home: prediction.home_score_pred,
          away: prediction.away_score_pred,
        })
      })
      setPredictionsByMatch(grouped)
    }
    if (error) {
      setLoadError('No se pudo guardar la predicción. Intentá de nuevo.')
    }
    setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
  }

  function updatePred(matchId, team, value) {
    setMyPredictions(p => ({
      ...p,
      [matchId]: { ...(p[matchId] || { home: 0, away: 0 }), [team]: Number(value) }
    }))
  }

  function getMyPrediction(matchId) {
    return myPredictions[matchId] || { home: 0, away: 0 }
  }

  function getOtherPredictions(matchId) {
    return (predictionsByMatch[matchId] || []).filter(prediction => prediction.user_id !== user?.id)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2>Partidos</h2>
      {loadError && (
        <div style={{
          marginBottom: 12,
          padding: '0.75rem 1rem',
          borderRadius: 'var(--border-radius-md)',
          background: 'rgba(220, 38, 38, 0.08)',
          color: '#b91c1c',
          border: '0.5px solid rgba(220, 38, 38, 0.2)'
        }}>
          {loadError}
        </div>
      )}
      {matches.map(match => {
        const started = isMatchStarted(match.match_time)
        const myPred = getMyPrediction(match.match_id)
        const otherPredictions = getOtherPredictions(match.match_id)
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
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>
                  {match.home_team}
                </span>
                <span style={{ minWidth: 56, textAlign: 'center', fontWeight: 600 }}>
                  {match.home_score ?? '—'}
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                <span style={{ minWidth: 56, textAlign: 'center', fontWeight: 600 }}>
                  {match.away_score ?? '—'}
                </span>
                <span style={{ flex: 1, fontWeight: 500 }}>
                  {match.away_team}
                </span>
              </div>

              <div style={{
                borderTop: '0.5px solid var(--color-border-tertiary)',
                paddingTop: 12,
                display: 'grid',
                gap: 10,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Tu predicción
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" min="0" max="20"
                    disabled={started || !user}
                    value={myPred.home ?? 0}
                    onChange={e => updatePred(match.match_id, 'home', e.target.value)}
                    style={{ width: 56, textAlign: 'center' }}
                  />
                  <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                  <input type="number" min="0" max="20"
                    disabled={started || !user}
                    value={myPred.away ?? 0}
                    onChange={e => updatePred(match.match_id, 'away', e.target.value)}
                    style={{ width: 56, textAlign: 'center' }}
                  />
                  <button
                    disabled={started || !user || saving[match.match_id]}
                    onClick={() => handleSave(match.match_id)}
                    style={{ minWidth: 90 }}
                  >
                    {saved[match.match_id] ? '✓ Guardado' : saving[match.match_id] ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Predicciones de usuarios
                  </div>
                  {otherPredictions.length > 0 ? otherPredictions.map(prediction => (
                    <div key={`${match.match_id}-${prediction.user_id}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      fontSize: 13,
                      color: 'var(--color-text-secondary)'
                    }}>
                      <span>{prediction.username}</span>
                      <span>{prediction.home} - {prediction.away}</span>
                    </div>
                  )) : (
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Aún no hay otras predicciones.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}