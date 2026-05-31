import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getElijoCreerSelection, saveElijoCreerSelection } from '../lib/db'

const underdogTeams = [
  'Nueva Zelanda',
  'Haiti',
  'Curazao',
  'Ghana',
  'Cabo Verde',
  'Bosnia y Herzegovina',
  'Jordania',
  'Arabia Saudita',
  'Sudafrica',
  'Irak',
  'Qatar',
  'Uzbekistan',
  'RD Congo',
  'Tunez',
  'Escocia',
]

const advancementPhases = [
  'Fase de grupos',
  'Dieciseisavos de final',
  'Octavos',
  'Cuartos',
  'Semis',
  'Final',
  'Campeón',
]

function formatPhaseLabel(phase) {
  if (phase === 'Semis') return 'Semis'
  return phase
}

function isMissingElijoCreerTable(error) {
  const message = (error?.message || '').toLowerCase()
  return error?.code === '42P01' || message.includes('elijo_creer_selections') && message.includes('does not exist')
}

export default function ElijoCreer() {
  const { user } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedPhase, setSelectedPhase] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSelection() {
      setSaveError('')

      if (!user) {
        setSelectedTeam('')
        setSelectedPhase('')
        setIsLocked(false)
        setIsLoaded(true)
        return
      }

      const { data, error } = await getElijoCreerSelection(user.id)

      if (!active) return

      if (error) {
        if (isMissingElijoCreerTable(error)) {
          setSaveError('Falta crear la tabla elijo_creer_selections en Supabase. Aplicá el SQL de supabase/elijo-creer-schema.sql.')
        }
        setSelectedTeam('')
        setSelectedPhase('')
        setIsLocked(false)
        setIsLoaded(true)
        return
      }

      if (data?.team && data?.phase) {
        setSelectedTeam(data.team)
        setSelectedPhase(data.phase)
        setIsLocked(true)
      } else {
        setSelectedTeam('')
        setSelectedPhase('')
        setIsLocked(false)
      }

      setIsLoaded(true)
    }

    loadSelection()

    return () => {
      active = false
    }
  }, [user])

  const selectionSummary = useMemo(() => {
    if (!selectedTeam || !selectedPhase) return ''

    if (selectedPhase === 'Fase de grupos') {
      return `Si pensas que ${selectedTeam} no pasa de fase de grupos, por qué no elegís otro equipo? xd`
    }

    if (selectedPhase === 'Dieciseisavos de final') {
      return `Vas con ${selectedTeam}, bancás pero veo un poco de tibieza acá`
    }

    if (selectedPhase === 'Octavos') {
      return `Ahh, ahí está, vas con ${selectedTeam} y los bancás hasta octavos, me gusta`
    }

    if (selectedPhase === 'Cuartos') {
      return `Epa, ${selectedTeam} en cuartos de final? Le tuvo que haber ganado a un grande seguramente, me gusta`
    }

    if (selectedPhase === 'Semis') {
      return `Mi abuelo en el mundial de la nada misma: guarda con ${selectedTeam}`
    }

    if (selectedPhase === 'Final') {
      return `En serio ${selectedTeam} en la final? Mirá yo en ningún momento pedí que te la juegues tanto`
    }

    if (selectedPhase === 'Campeón') {
      return `${selectedTeam} CAMPEÓN. ¿Te imaginás? Dale, confirmá. A que no te animás.`
    }

    return `${selectedTeam} · llega hasta ${selectedPhase}`
  }, [selectedPhase, selectedTeam])

  const confirmationMessage = 'Bien. Ya anoté tu decisión. Ahora hasta el final'
  const panelClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
  const chipBaseClass = 'rounded-full border px-3 py-2 text-sm font-medium transition'
  const chipInactiveClass = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
  const chipDisabledClass = 'cursor-not-allowed opacity-60'

  function handleSaveSelection() {
    if (!user || !selectedTeam || !selectedPhase || isLocked) return

    setIsSaving(true)
    setSaveError('')

    saveElijoCreerSelection(user.id, selectedTeam, selectedPhase)
      .then(({ error }) => {
        if (error) {
          if (isMissingElijoCreerTable(error)) {
            setSaveError('Falta crear la tabla elijo_creer_selections en Supabase. Aplicá el SQL de supabase/elijo-creer-schema.sql.')
            return
          }

          setSaveError(error.message || 'No se pudo guardar la elección. Intentá de nuevo.')
          return
        }

        if (error === null) {
          setIsLocked(true)
        }
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Apuesta única</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Elijo creer</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Elegí un solo equipo de los 15 más bajos del ranking FIFA y elegí hasta qué fase creés que va a llegar.
          Tu predicción queda guardada de forma permanente. UNA VEZ EMPIEZA EL MUNDIAL NO PODES ARRUGAR.
        </p>
      </div>

      {isLoaded && isLocked && (
        <div className={panelClass}>
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Tu elección quedó guardada
          </div>
          <p className="text-sm leading-6 text-slate-500">
            {confirmationMessage}
          </p>
        </div>
      )}

      <div className={`${panelClass} space-y-3`}>
        <div className="text-sm font-semibold text-slate-900">
          Elegí tu equipo
        </div>
        <div className="flex flex-wrap gap-2">
          {underdogTeams.map(team => {
            const isSelected = selectedTeam === team

            return (
              <button
                key={team}
                type="button"
                disabled={isLocked}
                onClick={() => setSelectedTeam(team)}
                className={`${chipBaseClass} ${isSelected ? 'border-slate-900 bg-slate-900 text-white' : chipInactiveClass} ${isLocked ? chipDisabledClass : ''}`}
              >
                {team}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`${panelClass} space-y-3`}>
        <div className="text-sm font-semibold text-slate-900">
          Seleccioná la fase máxima
        </div>
        <div className="flex flex-wrap gap-2">
          {advancementPhases.map(phase => {
            const isSelected = selectedPhase === phase

            return (
              <button
                key={phase}
                type="button"
                disabled={isLocked}
                onClick={() => setSelectedPhase(phase)}
                className={`${chipBaseClass} ${isSelected ? 'border-slate-900 bg-slate-900 text-white' : chipInactiveClass} ${isLocked ? chipDisabledClass : ''}`}
              >
                {formatPhaseLabel(phase)}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`${panelClass} space-y-3`}>
        <div className="text-sm font-semibold text-slate-900">
          Resumen
        </div>
        {saveError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
            {saveError}
          </p>
        )}
        <p className="text-sm leading-6 text-slate-500">
          {selectedTeam && selectedPhase
            ? selectionSummary
            : 'Elegí un equipo y una fase para habilitar el guardado permanente.'}
        </p>
        <button
          type="button"
          disabled={!user || !selectedTeam || !selectedPhase || isLocked || isSaving}
          onClick={handleSaveSelection}
          className="w-fit rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLocked ? 'Elección guardada' : isSaving ? 'Guardando...' : 'Guardar elección'}
        </button>
      </div>
    </section>
  )
}