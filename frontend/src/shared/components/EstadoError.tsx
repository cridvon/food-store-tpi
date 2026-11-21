import { handleApiError } from '../api/handleApiError'
import { Button } from '../ui/Button'

interface EstadoErrorProps {
  error: unknown
  onReintentar?: () => void
}

export function EstadoError({ error, onReintentar }: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <p className="font-semibold text-red-800">No se pudieron cargar los datos</p>
      <p className="text-sm text-red-700">{handleApiError(error)}</p>
      {onReintentar && (
        <Button variante="secundario" tamano="sm" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

/** Mensaje de error en línea para formularios y acciones. */
export function MensajeError({ mensaje }: { mensaje: string | null | undefined }) {
  if (!mensaje) return null
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {mensaje}
    </p>
  )
}
