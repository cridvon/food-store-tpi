import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea } from '../../../shared/ui/Input'
import { primerError } from '../../../shared/utils/formato'
import type { Categoria } from '../../categorias/types/categoria'
import type { Producto, ProductoCreate } from '../types/producto'

interface ProductoFormProps {
  inicial: Producto | null
  categorias: Categoria[]
  error: string | null
  onGuardar: (datos: ProductoCreate) => Promise<void>
  onCancelar: () => void
}

const entero = (texto: string) => (texto === '' ? Number.NaN : Number(texto))

export function ProductoForm({ inicial, categorias, error, onGuardar, onCancelar }: ProductoFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio_base: inicial ? String(inicial.precio_base) : '',
      imagen_url: inicial?.imagen_url ?? '',
      stock: inicial ? String(inicial.stock) : '0',
      disponible: inicial?.disponible ?? true,
      categoria_id: inicial ? String(inicial.categoria_id) : '',
    },
    onSubmit: async ({ value }) =>
      onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      }),
  })

  const mostrarError = (meta: { isTouched: boolean; errors: readonly unknown[] }) =>
    meta.isTouched ? primerError(meta.errors) : undefined

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <div className="sm:col-span-2">
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) => (value.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres' : undefined),
          }}
        >
          {(field) => (
            <Input
              id="producto-nombre"
              label="Nombre"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={mostrarError(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value ? undefined : 'Elegí una categoría') }}
      >
        {(field) => (
          <Select
            id="producto-categoria"
            label="Categoría"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={mostrarError(field.state.meta)}
          >
            <option value="">Elegir…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field
        name="precio_base"
        validators={{
          onChange: ({ value }) => {
            const n = entero(value)
            return Number.isNaN(n) || n < 0 ? 'El precio debe ser un número mayor o igual a 0' : undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="producto-precio"
            label="Precio ($)"
            type="number"
            min={0}
            step="0.01"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={mostrarError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            const n = entero(value)
            return !Number.isInteger(n) || n < 0 ? 'El stock debe ser un entero mayor o igual a 0' : undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="producto-stock"
            label="Stock"
            type="number"
            min={0}
            step={1}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={mostrarError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-stone-700">
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

      <div className="sm:col-span-2">
        <form.Field
          name="imagen_url"
          validators={{
            onChange: ({ value }) =>
              value.trim() && !/^https?:\/\//.test(value.trim()) ? 'La URL debe empezar con http:// o https://' : undefined,
          }}
        >
          {(field) => (
            <Input
              id="producto-imagen"
              label="URL de la imagen"
              placeholder="https://…"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={mostrarError(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <div className="sm:col-span-2">
        <form.Field name="descripcion">
          {(field) => (
            <Textarea
              id="producto-descripcion"
              label="Descripción"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <div className="sm:col-span-2">
        <MensajeError mensaje={error} />
      </div>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([puedeEnviar, enviando]) => (
            <Button type="submit" disabled={!puedeEnviar} cargando={enviando}>
              {inicial ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
