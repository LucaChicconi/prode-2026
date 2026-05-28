import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/db'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const { error } = isRegister
      ? await signUp(email, password, username)
      : await signIn(email, password)

    if (error) return setError(error.message)

    if (isRegister) {
      setError('Revisá tu email para confirmar la cuenta.')
    } else {
      navigate('/partidos')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>⚽ Prode 2026</h1>
      <h2>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <input
            placeholder="Nombre de usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required style={{ width: '100%', marginBottom: 8 }}
          />
        )}
        <input
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
          required style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="password" placeholder="Contraseña"
          value={password} onChange={e => setPassword(e.target.value)}
          required style={{ width: '100%', marginBottom: 12 }}
        />
        {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
        <button type="submit" style={{ width: '100%' }}>
          {isRegister ? 'Registrarse' : 'Entrar'}
        </button>
      </form>

      <p style={{ fontSize: 13, marginTop: 12, textAlign: 'center' }}>
        {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
        <button onClick={() => setIsRegister(!isRegister)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          {isRegister ? 'Iniciar sesión' : 'Registrarse'}
        </button>
      </p>
    </div>
  )
}