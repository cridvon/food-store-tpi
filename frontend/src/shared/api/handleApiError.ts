import axios from 'axios'

type ErrorDeValidacion = { msg?: string; loc?: (string | number)[] }

/** Convierte un error de la API en un mensaje para mostrar en pantalla. */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?'
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      // 422 de FastAPI: [{loc, msg}, ...]
      return (detail as ErrorDeValidacion[])
        .map((e) => {
          const campo = e.loc?.at(-1)
          return campo !== undefined ? `${String(campo)}: ${e.msg ?? ''}` : (e.msg ?? '')
        })
        .join(' · ')
    }
    return `Error ${error.response.status}`
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado'
}
