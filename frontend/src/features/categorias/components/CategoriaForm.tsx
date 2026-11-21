import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Textarea } from '../../../shared/ui/Input'
import { primerError } from '../../../shared/utils/formato'
import type { Categoria, CategoriaCreate } from '../types/categoria'

interface CategoriaFormProps {
  inicial: Categoria | null
  error: string | null
  onGuardar: (datos: CategoriaCreate) => Promise<void>
  onCancelar: () => void
}

export function CategoriaForm({ inicial, error, onGuardar, onCancelar }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' },
    onSubmit: async ({ value }) =>
      onGuardar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }),
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
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 2) return 'El nombre debe tener al menos 2 caracteres'
            if (largo > 100) return 'El nombre puede tener hasta 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="categoria-nombre"
            label="Nombre"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="descripcion">
        {(field) => (
          <Textarea
            id="categoria-descripcion"
            label="Descripción"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
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
              {inicial ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
