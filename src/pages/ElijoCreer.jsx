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

  function handleSaveSelection() {
    if (!user || !selectedTeam || !selectedPhase || isLocked) return

    setIsSaving(true)
    setSaveError('')

    saveElijoCreerSelection(user.id, selectedTeam, selectedPhase)
      .then(({ error }) => {
        if (error) {
          setSaveError('No se pudo guardar la elección. Intentá de nuevo.')
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 2rem' }}>
      <div style={{
        padding: '1.5rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'linear-gradient(135deg, rgba(255, 145, 77, 0.12), rgba(255, 95, 109, 0.08))',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4, marginBottom: 8 }}>
          NUEVA MODALIDAD
        </div>
        <h2 style={{ marginBottom: 10 }}>Elijo creer</h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.55, maxWidth: 720, margin: '0 auto' }}>
          Elegí un solo equipo de los 15 más bajos del ranking FIFA y fijá hasta qué fase creés que va a llegar.
          La selección queda guardada de forma permanente para tu usuario. UNA VEZ EMPIEZA EL MUNDIAL NO PODES ARRUGAR.
        </p>
      </div>

      {isLoaded && isLocked && (
        <div style={{
          marginBottom: 16,
          padding: '1rem',
          borderRadius: 'var(--border-radius-lg)',
          border: '0.5px solid var(--color-border-tertiary)',
          background: 'var(--color-background-primary)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            Tu elección quedó guardada
          </div>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.55, marginBottom: 0 }}>
            {confirmationMessage}
          </p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gap: 12,
        marginBottom: 20,
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
          Elegí tu equipo
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {underdogTeams.map(team => {
            const isSelected = selectedTeam === team

            return (
              <button
                key={team}
                type="button"
                disabled={isLocked}
                onClick={() => setSelectedTeam(team)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid var(--color-text-primary)' : '0.5px solid var(--color-border-tertiary)',
                  background: isSelected ? 'var(--color-background-secondary)' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                }}
              >
                {team}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gap: 12,
        marginBottom: 20,
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
          Seleccioná la fase máxima
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {advancementPhases.map(phase => {
            const isSelected = selectedPhase === phase

            return (
              <button
                key={phase}
                type="button"
                disabled={isLocked}
                onClick={() => setSelectedPhase(phase)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid var(--color-text-primary)' : '0.5px solid var(--color-border-tertiary)',
                  background: isSelected ? 'var(--color-background-secondary)' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                }}
              >
                {formatPhaseLabel(phase)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gap: 12,
        marginBottom: 20,
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
          Resumen
        </div>
        {saveError && (
          <p style={{ color: 'crimson', lineHeight: 1.55, margin: 0 }}>
            {saveError}
          </p>
        )}
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
          {selectedTeam && selectedPhase
            ? selectionSummary
            : 'Elegí un equipo y una fase para habilitar el guardado permanente.'}
        </p>
        <button
          type="button"
          disabled={!user || !selectedTeam || !selectedPhase || isLocked || isSaving}
          onClick={handleSaveSelection}
          style={{ width: 'fit-content' }}
        >
          {isLocked ? 'Elección guardada' : isSaving ? 'Guardando...' : 'Guardar elección'}
        </button>
      </div>
    </div>
  )
}