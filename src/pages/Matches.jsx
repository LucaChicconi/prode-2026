import { useEffect, useMemo, useState } from 'react'
import { getMatches, savePrediction, getMyPredictions } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [myPredictions, setMyPredictions] = useState({})
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState({})
  const [loadError, setLoadError] = useState('')

  function getMatchKey(match) {
    return match.match_id ?? match.id
  }

  function getMatchGroup(match) {
    return match.stage || 'Sin grupo'
  }

  function getMatchDateKey(matchTime) {
    return new Date(matchTime).toISOString().slice(0, 10)
  }

  function formatDateLabel(dateKey) {
    return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  useEffect(() => {
    async function loadData() {
      setLoadError('')
      const { data: matchesData, error: matchesError } = await getMatches()

      if (matchesError) {
        setLoadError('No se pudieron cargar los partidos.')
      }

      setMatches(matchesData || [])

      if (user) {
        const { data: myPredictionsData } = await getMyPredictions(user.id)
        const own = {}
        myPredictionsData?.forEach(prediction => {
          const predictionMatchKey = prediction.match_id ?? prediction.matches?.id ?? prediction.matches?.match_id
          if (!predictionMatchKey) return
          own[predictionMatchKey] = {
            home: prediction.home_score_pred,
            away: prediction.away_score_pred,
          }
        })
        setMyPredictions(own)
      }
    }

    loadData()
  }, [user])

  const groupOptions = useMemo(() => {
    const groups = Array.from(new Set(matches.map(getMatchGroup)))
    return groups.sort((a, b) => a.localeCompare(b))
  }, [matches])

  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(matches.map(match => getMatchDateKey(match.match_time))))
    return dates.sort((a, b) => a.localeCompare(b))
  }, [matches])

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchesGroup = !selectedGroup || getMatchGroup(match) === selectedGroup
      const matchesDate = !selectedDate || getMatchDateKey(match.match_time) === selectedDate
      return matchesGroup && matchesDate
    })
  }, [matches, selectedDate, selectedGroup])

  const groupedMatches = useMemo(() => {
    const byDate = {}
    filteredMatches.forEach(match => {
      const dateKey = getMatchDateKey(match.match_time)
      if (!byDate[dateKey]) byDate[dateKey] = {}
      const groupKey = getMatchGroup(match)
      if (!byDate[dateKey][groupKey]) byDate[dateKey][groupKey] = []
      byDate[dateKey][groupKey].push(match)
    })

    return Object.entries(byDate)
      .map(([dateKey, groups]) => ({
        dateKey,
        groups: Object.entries(groups).map(([groupKey, items]) => ({
          groupKey,
          items,
        })),
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [filteredMatches])

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
        const predictionMatchKey = prediction.match_id ?? prediction.matches?.id ?? prediction.matches?.match_id
        if (!predictionMatchKey) return
        own[predictionMatchKey] = {
          home: prediction.home_score_pred,
          away: prediction.away_score_pred,
        }
      })
      setMyPredictions(own)
      const { data } = await getPredictions()
      const grouped = {}
      data?.forEach(prediction => {
        const predictionMatchKey = prediction.match_id ?? prediction.matches?.id ?? prediction.matches?.match_id
        if (!predictionMatchKey) return
        if (!grouped[predictionMatchKey]) grouped[predictionMatchKey] = []
        grouped[predictionMatchKey].push({
          user_id: prediction.user_id,
          username: prediction.profiles?.username || 'Usuario',
          home: prediction.home_score_pred,
          away: prediction.away_score_pred,
        })
      })
      setPredictionsByMatch(grouped)
    }
    if (error) {
      console.error('No se pudo guardar la predicción.', error)
      setPredictionNotice('No se pudo guardar la predicción. Intentá de nuevo.')
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

  function renderMatchCard(match) {
    const started = isMatchStarted(match.match_time)
    const matchKey = getMatchKey(match)
    const myPred = getMyPrediction(matchKey)

    return (
      <div key={matchKey} style={{
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
                onChange={e => updatePred(matchKey, 'home', e.target.value)}
                style={{ width: 56, textAlign: 'center' }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
              <input type="number" min="0" max="20"
                disabled={started || !user}
                value={myPred.away ?? 0}
                onChange={e => updatePred(matchKey, 'away', e.target.value)}
                style={{ width: 56, textAlign: 'center' }}
              />
              <button
                disabled={started || !user || saving[matchKey]}
                onClick={() => handleSave(matchKey)}
                style={{ minWidth: 90 }}
              >
                {saved[matchKey] ? '✓ Guardado' : saving[matchKey] ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2>Partidos</h2>
      <div style={{
        display: 'grid',
        gap: 12,
        marginBottom: 16,
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)'
      }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="group-filter" style={{ fontSize: 13, fontWeight: 600 }}>
            Grupo
          </label>
          <select
            id="group-filter"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
          >
            <option value="">Todos los grupos</option>
            {groupOptions.map(group => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="date-filter" style={{ fontSize: 13, fontWeight: 600 }}>
            Fecha
          </label>
          <select
            id="date-filter"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          >
            <option value="">Todas las fechas</option>
            {dateOptions.map(dateKey => (
              <option key={dateKey} value={dateKey}>
                {formatDateLabel(dateKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
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
      {selectedDate ? (
        groupedMatches.length > 0 ? groupedMatches.map(dateSection => (
          <div key={dateSection.dateKey} style={{ marginBottom: 16 }}>
            <div style={{
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {formatDateLabel(dateSection.dateKey)}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {dateSection.groups.map(groupSection => (
                <div key={`${dateSection.dateKey}-${groupSection.groupKey}`} style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {groupSection.groupKey}
                  </div>
                  {groupSection.items.map(renderMatchCard)}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            No hay partidos para los filtros seleccionados.
          </div>
        )
      ) : filteredMatches.length > 0 ? (
        filteredMatches.map(renderMatchCard)
      ) : (
        <div style={{ color: 'var(--color-text-secondary)' }}>
          No hay partidos para los filtros seleccionados.
        </div>
      )}
    </div>
  )
}