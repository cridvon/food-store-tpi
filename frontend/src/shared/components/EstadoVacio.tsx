import type { ReactNode } from 'react'

interface EstadoVacioProps {
  titulo: string
  mensaje?: string
  accion?: ReactNode
}

export function EstadoVacio({ titulo, mensaje, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <p className="text-lg font-semibold text-stone-700">{titulo}</p>
      {mensaje && <p className="max-w-md text-stone-500">{mensaje}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
