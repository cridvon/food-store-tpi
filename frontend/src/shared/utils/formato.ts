const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

const fecha = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export const formatPrecio = (valor: number): string => moneda.format(valor)

export const formatFecha = (iso: string): string => fecha.format(new Date(iso))

/** Devuelve el primer mensaje de error de un campo de TanStack Form. */
export function primerError(errores: readonly unknown[]): string | undefined {
  const error = errores.find((e) => typeof e === 'string' && e.length > 0)
  return typeof error === 'string' ? error : undefined
}
