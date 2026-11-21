import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { primerError } from '../../../shared/utils/formato'
import type { Producto, ProductoStockUpdate } from '../types/producto'

interface StockFormProps {
  producto: Producto
  error: string | null
  onGuardar: (datos: ProductoStockUpdate) => Promise<void>
  onCancelar: () => void
}

/** Cambio rápido de stock y disponibilidad (PATCH /productos/{id}/stock). */
export function StockForm({ producto, error, onGuardar, onCancelar }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: async ({ value }) => onGuardar({ stock: Number(value.stock), disponible: value.disponible }),
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
      <p className="text-sm text-stone-600">
        <span className="font-medium text-stone-800">{producto.nombre}</span> · stock actual: {producto.stock}
      </p>

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            const n = value === '' ? Number.NaN : Number(value)
            return !Number.isInteger(n) || n < 0 ? 'El stock debe ser un entero mayor o igual a 0' : undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="stock-cantidad"
            label="Nuevo stock"
            type="number"
            min={0}
            step={1}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={primerError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 accent-brand-600"
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      <MensajeError mensaje={error} />

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([puedeEnviar, enviando]) => (
            <Button type="submit" disabled={!puedeEnviar} cargando={enviando}>
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
