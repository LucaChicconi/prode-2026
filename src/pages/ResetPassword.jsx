import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden')
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) return setError(error.message)
    setSuccess(true)
  }

  if (success) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-3 sm:py-6">
        <div className="w-full rounded-2xl border border-primary-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="mb-4 space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-500 sm:text-base sm:tracking-[0.24em]">Prode Mundial 2026</p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary-950 sm:text-4xl">
              Contraseña actualizada
            </h1>
            <p className="text-base text-primary-500">Tu contraseña se cambió correctamente</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-base font-medium text-white transition hover:bg-primary-600"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-3 sm:py-6">
      <div className="w-full rounded-2xl border border-primary-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-500 sm:text-base sm:tracking-[0.24em]">Prode Mundial 2026</p>
          <h1 className="text-3xl font-semibold tracking-tight text-primary-950 sm:text-4xl">
            Nueva contraseña
          </h1>
          <p className="text-base text-primary-500">Elegí tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            className="w-full rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-base text-primary-900 outline-none transition placeholder:text-primary-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            className="w-full rounded-xl border border-primary-200 bg-white px-3 py-2.5 text-base text-primary-900 outline-none transition placeholder:text-primary-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-base font-medium text-white transition hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        <p className="mt-3 text-center text-base text-primary-500">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-primary-900 underline decoration-primary-300 underline-offset-4 transition hover:decoration-primary-900"
          >
            Volver al inicio de sesión
          </button>
        </p>
      </div>
    </section>
  )
}