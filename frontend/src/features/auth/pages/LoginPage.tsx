import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { primerError } from '../../../shared/utils/formato'
import { useAuthStore } from '../../../store/authStore'

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()
  const location = useLocation()
  const desde = (location.state as { desde?: string } | null)?.desde ?? '/'
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await login(value.username.trim(), value.password)
        navigate(desde, { replace: true })
      } catch (e) {
        setError(handleApiError(e))
      }
    },
  })

  if (usuario) return <Navigate to={desde} replace />

  return (
    <div className="mx-auto max-w-sm">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Ingresar</h1>
        <p className="mt-1 text-sm text-stone-500">Usá tu usuario para comprar y ver tus pedidos.</p>

        <form
          className="mt-6 flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu usuario') }}
          >
            {(field) => (
              <Input
                id="login-username"
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'Ingresá tu contraseña') }}
          >
            {(field) => (
              <Input
                id="login-password"
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <MensajeError mensaje={error} />

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([puedeEnviar, enviando]) => (
              <Button type="submit" disabled={!puedeEnviar} cargando={enviando}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
