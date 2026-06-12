import { useEffect, useMemo, useState } from 'react'
import { getMatches, savePrediction, deletePrediction, getMyPredictions, isUserAdmin, toggleMatchLock } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

const defaultTopTenTeams = new Set([
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
].map(normalizeTeamName))

const defaultLowerFifaTeams = new Set([
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
].map(normalizeTeamName))

function normalizeTeamName(teamName) {
  return String(teamName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

function isTopTenTeam(teamName) {
  return defaultTopTenTeams.has(normalizeTeamName(teamName))
}

function isLowerFifaTeam(teamName) {
  return defaultLowerFifaTeams.has(normalizeTeamName(teamName))
}

function isPossibleBatacazo(match) {
  return (
    (isLowerFifaTeam(match.away_team) && isTopTenTeam(match.home_team)) ||
    (isLowerFifaTeam(match.home_team) && isTopTenTeam(match.away_team))
  )
}

const teamFlagCodes = {
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  francia: 'fr',
  'españa': 'es',
  inglaterra: 'gb-eng',
  'estados unidos': 'us',
  'republica checa': 'cz',
  'corea del sur': 'kr',
  'costa de marfil': 'ci',
  'ecuador': 'ec',
  'iran': 'ir',
  'japon': 'jp',
  'mexico': 'mx',
  'noruega': 'no',
  portugal: 'pt',
  brasil: 'br',
  'paises bajos': 'nl',
  paraguay: 'py',
  marruecos: 'ma',
  belgica: 'be',
  alemania: 'de',
  'croacia': 'hr',
  'nueva zelanda': 'nz',
  haiti: 'ht',
  curazao: 'cw',
  ghana: 'gh',
  'cabo verde': 'cv',
  'bosnia y herzegovina': 'ba',
  jordania: 'jo',
  'arabia saudita': 'sa',
  sudafrica: 'za',
  irak: 'iq',
  qatar: 'qa',
  'catar': 'qa',
  uzbekistan: 'uz',
  'rd congo': 'cd',
  tunez: 'tn',
  escocia: 'gb-sct',
  argelia: 'dz',
  'suiza': 'ch',
  'suecia': 'se',
  senegal: 'sn',
  turquia: 'tr',
  'uruguay': 'uy',
  'colombia': 'co',
  panama: 'pa',
}

// Create a normalized-keys map so lookups work regardless of accents/casing
const normalizedTeamFlagCodes = Object.fromEntries(
  Object.entries(teamFlagCodes).map(([k, v]) => [normalizeTeamName(k), v])
)

function getTeamFlagCode(teamName) {
  return normalizedTeamFlagCodes[normalizeTeamName(teamName)] || ''
}

function TeamLabel({ teamName, align = 'left' }) {
  const flagCode = getTeamFlagCode(teamName)

  return (
    <span className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      {flagCode ? (
        <span
          className={`fi fi-${flagCode} inline-block shrink-0 rounded-sm shadow-sm`}
          aria-hidden="true"
        />
      ) : null}
      <span className="truncate text-sm sm:text-base">{teamName}</span>
    </span>
  )
}


const groupBadgeColors = {
  a: '#E53935',
  b: '#FB8C00',
  c: '#FDD835',
  d: '#C0CA33',
  e: '#43A047',
  f: '#00897B',
  g: '#00ACC1',
  h: '#1E88E5',
  i: '#3949AB',
  j: '#8E24AA',
  k: '#D81B60',
  l: '#6D4C41',
}

function getGroupBadgeStyles(groupName) {
  const normalizedGroup = String(groupName || '').toLowerCase().match(/grupo\s*([a-l])/)
  const colorKey = normalizedGroup?.[1]
  const backgroundColor = colorKey ? groupBadgeColors[colorKey] : '#64748B'
  const isLightColor = ['#FDD835', '#C0CA33'].includes(backgroundColor)

  return {
    backgroundColor,
    color: isLightColor ? '#0F172A' : '#FFFFFF',
  }
}

function ScoreInput({ value, disabled, onChange }) {
  const [draft, setDraft] = useState(value != null ? String(value) : '')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) {
      setDraft(value != null ? String(value) : '')
    }
  }, [value, editing])

  function handleFocus(e) {
    setEditing(true)
    e.target.select()
  }

  function handleChange(e) {
    const raw = e.target.value
    if (raw === '') {
      setDraft('')
      return
    }
    if (/^\d{1,2}$/.test(raw) && Number(raw) <= 20) {
      setDraft(raw)
    }
  }

  function handleBlur() {
    setEditing(false)
    const num = draft === '' ? 0 : Number(draft)
    setDraft(draft === '' ? '' : String(num))
    onChange(num)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      disabled={disabled}
      value={draft}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-14 rounded-xl border border-primary-200 bg-white px-2 py-2 text-center text-sm text-primary-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 disabled:bg-primary-50 disabled:text-primary-400 sm:w-16 sm:text-base"
    />
  )
}

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [myPredictions, setMyPredictions] = useState({})
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState({})
  const [loadError, setLoadError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

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

  function formatMatchDateTime(matchTime) {
    return new Date(matchTime).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
        const admin = await isUserAdmin(user.id)
        setIsAdmin(admin)
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
        setIsAdmin(false)
      }
    }

    loadData()

    const interval = setInterval(loadData, 10000)

    return () => clearInterval(interval)
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

  function updatePred(matchId, team, value) {
    setMyPredictions(p => ({
      ...p,
      [matchId]: { ...(p[matchId] || { home: 0, away: 0 }), [team]: value },
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

  async function handleToggleLock(matchId, currentLocked) {
    const { error } = await toggleMatchLock(user.id, matchId, !currentLocked)
    if (error) {
      setLoadError('No se pudo cambiar el estado del partido.')
      return
    }
    setMatches(matches.map(m =>
      m.id === matchId ? { ...m, locked: !currentLocked } : m
    ))
  }

  function renderMatchCard(match) {
    const matchKey = getMatchKey(match)
    const myPred = getMyPrediction(matchKey)
    const locked = match.locked || !user || Boolean(saved[matchKey])

    return (
      <div key={matchKey} className="rounded-2xl border border-primary-200 bg-white p-2 shadow-sm sm:p-3">
        <div className="mb-1.5 flex flex-col gap-1 text-sm text-primary-500 sm:flex-row sm:items-center sm:justify-between sm:text-base">
          <span className="truncate">{formatMatchDateTime(match.match_time)}</span>
          <div className="flex flex-wrap items-center gap-2">
          {isPossibleBatacazo(match) && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 sm:text-sm">
              🔥 Posible batacazo
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium sm:text-sm"
            style={getGroupBadgeStyles(match.stage)}
          >
            {match.stage}
          </span>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-2 text-base sm:gap-3 sm:text-lg">
            <span className="min-w-0 text-right font-medium text-primary-900">
              <TeamLabel teamName={match.home_team} align="right" />
            </span>
            <span className="min-w-8 text-center font-semibold text-primary-900 sm:min-w-12">{match.home_score ?? '—'}</span>
            <span className="text-primary-400">-</span>
            <span className="min-w-8 text-center font-semibold text-primary-900 sm:min-w-12">{match.away_score ?? '—'}</span>
            <span className="min-w-0 font-medium text-primary-900">
              <TeamLabel teamName={match.away_team} />
            </span>
          </div>

          <div className="grid gap-1.5 border-t border-primary-200 pt-2 justify-items-center text-center">
            <div className="text-center text-base font-semibold text-primary-900">Tu predicción</div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <ScoreInput
                value={myPred.home ?? 0}
                disabled={locked}
                onChange={val => updatePred(matchKey, 'home', val)}
              />
              <span className="text-primary-400">-</span>
              <ScoreInput
                value={myPred.away ?? 0}
                disabled={locked}
                onChange={val => updatePred(matchKey, 'away', val)}
              />
              <button
                disabled={locked || saving[matchKey]}
                onClick={() => handleSave(matchKey)}
                className={`rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors duration-300 sm:px-4 sm:text-base ${
                  saved[matchKey] ? 'bg-emerald-600' : 'bg-primary-500 hover:bg-emerald-600'
                } disabled:cursor-not-allowed disabled:opacity-80`}
              >
                {saved[matchKey] ? 'Guardado' : saving[matchKey] ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            {saved[matchKey] && !match.locked && (
              <button
                type="button"
                onClick={() => handleDelete(matchKey)}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors duration-300 hover:bg-red-600 hover:text-white sm:px-4 sm:text-base"
              >
                Cambié de opinión
              </button>
            )}
            {match.locked && (
              <span className="text-sm text-red-600 font-medium sm:text-base">
                Es muy tarde, ya empezó el partido!
              </span>
            )}
            {isAdmin && (
              <button
                onClick={() => handleToggleLock(match.id, match.locked)}
                className={`rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors duration-300 sm:px-4 sm:text-base ${
                  match.locked ? 'bg-red-600' : 'bg-amber-500'
                }`}
              >
                {match.locked ? 'Desbloquear' : 'Bloquear'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-primary-300 bg-white px-4 py-10 text-center text-base text-primary-500 shadow-sm">
      No hay partidos para los filtros seleccionados.
    </div>
  )

  return (
    <section className="mx-auto w-full max-w-4xl space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-200 sm:text-base sm:tracking-[0.24em]">Calendario</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Partidos</h1>
        <p className="text-base text-primary-200">Filtrá por grupo o fecha y cargá tu resultado exacto.</p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-primary-200 bg-white p-2 shadow-sm sm:grid-cols-2 sm:gap-3 sm:p-3">
        <div className="grid gap-1 sm:gap-1.5">
          <label htmlFor="group-filter" className="text-sm font-medium text-primary-700 sm:text-base">Grupo</label>
          <select
            id="group-filter"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 sm:text-base"
          >
            <option value="">Todos los grupos</option>
            {groupOptions.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5 sm:gap-2">
          <label htmlFor="date-filter" className="text-sm font-medium text-primary-700 sm:text-base">Fecha</label>
          <select
            id="date-filter"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 sm:text-base"
          >
            <option value="">Todas las fechas</option>
            {dateOptions.map(dateKey => (
              <option key={dateKey} value={dateKey}>{formatDateLabel(dateKey)}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-700">
          {loadError}
        </div>
      )}

      {selectedDate ? (
        groupedMatches.length > 0 ? (
          groupedMatches.map(dateSection => (
            <div key={dateSection.dateKey} className="space-y-2">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-200">
                {formatDateLabel(dateSection.dateKey)}
              </div>
              <div className="grid gap-3">
                {dateSection.groups.map(groupSection => (
                  <div key={`${dateSection.dateKey}-${groupSection.groupKey}`} className="grid gap-2">
                    <div className="text-base font-semibold text-white">{groupSection.groupKey}</div>
                    {groupSection.items.map(renderMatchCard)}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : emptyState
      ) : filteredMatches.length > 0 ? (
        <div className="grid gap-3">{filteredMatches.map(renderMatchCard)}</div>
      ) : (
        emptyState
      )}
    </section>
  )
}