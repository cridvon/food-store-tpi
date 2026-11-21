import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { primerError } from '../../../shared/utils/formato'
import { useAuthStore } from '../../../store/authStore'
import { registrar } from '../api/auth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const login = useAuthStore((s) => s.login)
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirmacion: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await registrar({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        })
        // Después del registro se inicia la sesión directamente
        await login(value.username.trim(), value.password)
        navigate('/', { replace: true })
      } catch (e) {
        setError(handleApiError(e))
      }
    },
  })

  if (usuario) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-stone-500">Registrate para hacer pedidos.</p>

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
            validators={{
              onChange: ({ value }) =>
                value.trim().length < 3 ? 'El usuario debe tener al menos 3 caracteres' : undefined,
            }}
          >
            {(field) => (
              <Input
                id="reg-username"
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
            name="full_name"
            validators={{
              onChange: ({ value }) => (value.trim().length < 2 ? 'Ingresá tu nombre completo' : undefined),
            }}
          >
            {(field) => (
              <Input
                id="reg-nombre"
                label="Nombre completo"
                autoComplete="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => (EMAIL.test(value.trim()) ? undefined : 'Ingresá un email válido'),
            }}
          >
            {(field) => (
              <Input
                id="reg-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : undefined,
            }}
          >
            {(field) => (
              <Input
                id="reg-password"
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="confirmacion"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue('password') ? 'Las contraseñas no coinciden' : undefined,
            }}
          >
            {(field) => (
              <Input
                id="reg-confirmacion"
                label="Repetir contraseña"
                type="password"
                autoComplete="new-password"
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
                Crear cuenta
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </Card>
    </div>
  )
}
