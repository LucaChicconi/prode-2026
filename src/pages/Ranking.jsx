import { useEffect, useState } from 'react'
import { getRanking } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Ranking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    getRanking().then(({ data }) => setRanking(data || []))
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2>Ranking</h2>
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
          <span style={{ fontWeight: 500 }}>{profile.total_points} pts</span>
        </div>
      ))}
      {ranking.length === 0 &&
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Aún no hay puntos cargados.
        </p>
      }
    </div>
  )
}