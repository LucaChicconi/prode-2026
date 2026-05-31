import { useEffect, useMemo, useState } from 'react'
import { getMatches, savePrediction, deletePrediction, getMyPredictions } from '../lib/db'
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
        const ownSaved = {}
        myPredictionsData?.forEach(prediction => {
          const predictionMatchKey = prediction.match_id ?? prediction.matches?.id ?? prediction.matches?.match_id
          if (!predictionMatchKey) return
          own[predictionMatchKey] = {
            home: prediction.home_score_pred,
            away: prediction.away_score_pred,
          }
          ownSaved[predictionMatchKey] = true
        })
        setMyPredictions(own)
        setSaved(ownSaved)
      } else {
        setMyPredictions({})
        setSaved({})
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

  function updatePred(matchId, team, value) {
    setMyPredictions(p => ({
      ...p,
      [matchId]: { ...(p[matchId] || { home: 0, away: 0 }), [team]: Number(value) },
    }))
  }

  function getMyPrediction(matchId) {
    return myPredictions[matchId] || { home: 0, away: 0 }
  }

  async function handleSave(matchId) {
    const pred = myPredictions[matchId]
    if (!pred || !user || saved[matchId]) return

    setSaving(s => ({ ...s, [matchId]: true }))
    const { error } = await savePrediction(user.id, matchId, pred.home, pred.away)
    setSaving(s => ({ ...s, [matchId]: false }))

    if (error) {
      setLoadError('No se pudo guardar la predicción. Intentá de nuevo.')
      return
    }

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
  }

  async function handleDelete(matchId) {
    if (!user) return

    setSaving(s => ({ ...s, [matchId]: true }))
    const { error } = await deletePrediction(user.id, matchId)
    setSaving(s => ({ ...s, [matchId]: false }))

    if (error) {
      setLoadError('No se pudo borrar la predicción. Intentá de nuevo.')
      return
    }

    setSaved(s => ({ ...s, [matchId]: false }))
    setMyPredictions(p => ({
      ...p,
      [matchId]: { home: 0, away: 0 },
    }))
  }

  function renderMatchCard(match) {
    const started = isMatchStarted(match.match_time)
    const matchKey = getMatchKey(match)
    const myPred = getMyPrediction(matchKey)
    const locked = started || !user || Boolean(saved[matchKey])

    return (
      <div key={matchKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>{new Date(match.match_time).toLocaleString('es-AR')}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{match.stage}</span>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center gap-3 text-sm sm:text-base">
            <span className="flex-1 text-right font-medium text-slate-900">{match.home_team}</span>
            <span className="min-w-12 text-center font-semibold text-slate-900">{match.home_score ?? '—'}</span>
            <span className="text-slate-400">-</span>
            <span className="min-w-12 text-center font-semibold text-slate-900">{match.away_score ?? '—'}</span>
            <span className="flex-1 font-medium text-slate-900">{match.away_team}</span>
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-4 justify-items-center text-center">
            <div className="text-center text-sm font-semibold text-slate-900">Tu predicción</div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <input
                type="number"
                min="0"
                max="20"
                disabled={locked}
                value={myPred.home ?? 0}
                onChange={e => updatePred(matchKey, 'home', e.target.value)}
                className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                min="0"
                max="20"
                disabled={locked}
                value={myPred.away ?? 0}
                onChange={e => updatePred(matchKey, 'away', e.target.value)}
                className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                disabled={locked || saving[matchKey]}
                onClick={() => handleSave(matchKey)}
                className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors duration-300 ${
                  saved[matchKey] ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-emerald-600'
                } disabled:cursor-not-allowed disabled:opacity-80`}
              >
                {saved[matchKey] ? 'Guardado' : saving[matchKey] ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            {saved[matchKey] && (
              <button
                type="button"
                onClick={() => handleDelete(matchKey)}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors duration-300 hover:bg-red-600 hover:text-white"
              >
                Cambié de opinión
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
      No hay partidos para los filtros seleccionados.
    </div>
  )

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Calendario</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Partidos</h1>
        <p className="text-sm text-slate-500">Filtrá por grupo o fecha y cargá tu resultado exacto.</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="group-filter" className="text-sm font-medium text-slate-700">Grupo</label>
          <select
            id="group-filter"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">Todos los grupos</option>
            {groupOptions.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="date-filter" className="text-sm font-medium text-slate-700">Fecha</label>
          <select
            id="date-filter"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">Todas las fechas</option>
            {dateOptions.map(dateKey => (
              <option key={dateKey} value={dateKey}>{formatDateLabel(dateKey)}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {selectedDate ? (
        groupedMatches.length > 0 ? (
          groupedMatches.map(dateSection => (
            <div key={dateSection.dateKey} className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {formatDateLabel(dateSection.dateKey)}
              </div>
              <div className="grid gap-4">
                {dateSection.groups.map(groupSection => (
                  <div key={`${dateSection.dateKey}-${groupSection.groupKey}`} className="grid gap-3">
                    <div className="text-sm font-semibold text-slate-900">{groupSection.groupKey}</div>
                    {groupSection.items.map(renderMatchCard)}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : emptyState
      ) : filteredMatches.length > 0 ? (
        <div className="grid gap-4">{filteredMatches.map(renderMatchCard)}</div>
      ) : (
        emptyState
      )}
    </section>
  )
}