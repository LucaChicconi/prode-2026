import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, resetPasswordForEmail } from '../lib/db'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isForgotPassword) {
      const { error } = await resetPasswordForEmail(email)
      if (error) return setError(error.message)
      setSuccess('Revisá tu email para restablecer la contraseña. Fijate en spam!')
      return
    }

    const { error } = isRegister
      ? await signUp(email, password, username)
      : await signIn(email, password)

    if (error) return setError(error.message)

    if (isRegister) {
      setSuccess('Revisá tu email para confirmar la cuenta. Fijate en spam!')
    } else {
      navigate('/eliminatorias')
    }
  }

  function resetForm() {
    setIsForgotPassword(false)
    setIsRegister(false)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setUsername('')
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-3 sm:py-6">
      <div className="w-full rounded-2xl border border-primary-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-500 sm:text-base sm:tracking-[0.24em]">Prode Mundial 2026</p>
          <h1 className="text-3xl font-semibold tracking-tight text-primary-950 sm:text-4xl">
            {isForgotPassword ? 'Recuperar contraseña' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-base text-primary-500">
            {isForgotPassword ? 'Te enviamos un email para restablecer tu contraseña' : 'Registrate, jugá y demostrá lo que sabés de fútbol'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
        {isRegister && !isForgotPassword && (
          <input
            className="w-full rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-base text-primary-900 outline-none transition placeholder:text-primary-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            placeholder="Nombre de usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          className="w-full rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-base text-primary-900 outline-none transition placeholder:text-primary-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
          required
        />
        {!isForgotPassword && (
          <input
            className="w-full rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-base text-primary-900 outline-none transition placeholder:text-primary-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            type="password" placeholder="Contraseña"
            value={password} onChange={e => setPassword(e.target.value)}
            required
          />
        )}
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700">{error}</p>}
        {success && <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-base text-green-700">{success}</p>}
        <button type="submit" className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-base font-medium text-white transition hover:bg-primary-600">
          {isForgotPassword ? 'Enviar enlace' : isRegister ? 'Registrarse' : 'Entrar'}
        </button>
        </form>

        <div className="mt-3 space-y-2 text-center text-base text-primary-500">
          {!isForgotPassword && (
            <p>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true)
                  setError('')
                  setSuccess('')
                }}
                className="font-medium text-primary-900 underline decoration-primary-300 underline-offset-4 transition hover:decoration-primary-900"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </p>
          )}
          <p>
            {isForgotPassword ? (
              <button
                type="button"
                onClick={resetForm}
                className="font-medium text-primary-900 underline decoration-primary-300 underline-offset-4 transition hover:decoration-primary-900"
              >
                Volver al inicio de sesión
              </button>
            ) : (
              <>
                {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError('')
                    setSuccess('')
                  }}
                  className="font-medium text-primary-900 underline decoration-primary-300 underline-offset-4 transition hover:decoration-primary-900"
                >
                  {isRegister ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}