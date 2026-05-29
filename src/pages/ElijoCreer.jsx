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

const scoringStages = [
  {
    title: 'Fase de grupos',
    points: '+2 por cada punto conseguido',
    description: 'Cada empate o victoria del equipo elegido suma al usuario.',
  },
  {
    title: 'Dieciseisavos de final',
    points: '+5 puntos',
    description: 'Si el equipo clasifica, el usuario recibe el bonus.',
  },
  {
    title: 'Octavos de final',
    points: '+8 puntos',
    description: 'La campaña empieza a tomar forma en eliminación directa.',
  },
  {
    title: 'Cuartos de final',
    points: '+12 puntos',
    tag: ':fuego: Campaña heróica!',
    description: 'Llegar hasta acá ya es una historia grande.',
  },
  {
    title: 'Semifinales',
    points: '+17 puntos',
    tag: 'Campaña histórica!',
    description: 'El underdog ya está entre los cuatro mejores.',
  },
  {
    title: 'Final o tercer puesto',
    points: '+25 puntos',
    description: 'Si llega a la definición o al partido por el tercer lugar.',
  },
  {
    title: 'Campeón',
    points: '+50 puntos extra',
    tag: ':boom: LA ROMPIO TODA',
    description: 'El premio máximo para la elección más valiente.',
  },
]

export default function ElijoCreer() {
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
          Cada jugador elige uno de los 15 equipos de ranking FIFA más bajo para acompañarlo durante el Mundial.
          Cuanto más lejos llegue ese equipo, más puntos suma el usuario.
        </p>
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
          Los 15 posibles elegidos
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {underdogTeams.map(team => (
            <span
              key={team}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '999px',
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
                fontWeight: 500,
              }}
            >
              {team}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {scoringStages.map(stage => (
          <div
            key={stage.title}
            style={{
              padding: '1rem',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              background: 'var(--color-background-primary)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{stage.title}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{stage.points}</div>
            </div>
            <p style={{ marginTop: 8, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
              {stage.description}
            </p>
            {stage.tag && (
              <div style={{
                display: 'inline-flex',
                marginTop: 10,
                padding: '0.35rem 0.7rem',
                borderRadius: '999px',
                background: 'var(--color-background-secondary)',
                border: '0.5px solid var(--color-border-tertiary)',
                fontSize: 13,
                fontWeight: 700,
              }}>
                {stage.tag}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}