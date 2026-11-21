import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea } from '../../../shared/ui/Input'
import { primerError } from '../../../shared/utils/formato'
import type { FormaPago } from '../types/pedido'

export interface DatosCheckout {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string
}

interface CheckoutFormProps {
  onConfirmar: (datos: DatosCheckout) => Promise<void>
  error: string | null
}

export function CheckoutForm({ onConfirmar, error }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: async ({ value }) => onConfirmar(value),
  })

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (largo > 200) return 'La dirección puede tener hasta 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="checkout-direccion"
            label="Dirección de entrega"
            placeholder="Calle, número, piso y ciudad"
            autoComplete="street-address"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <Select
            id="checkout-pago"
            label="Forma de pago"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as FormaPago)}
          >
            <option value="EFECTIVO">Efectivo al recibir</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
          </Select>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{
          onChange: ({ value }) => (value.length > 500 ? 'Las notas pueden tener hasta 500 caracteres' : undefined),
        }}
      >
        {(field) => (
          <Textarea
            id="checkout-notas"
            label="Notas (opcional)"
            placeholder="Timbre, sin cebolla, etc."
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={primerError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      <MensajeError mensaje={error} />

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([puedeEnviar, enviando]) => (
          <Button type="submit" disabled={!puedeEnviar} cargando={enviando}>
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
