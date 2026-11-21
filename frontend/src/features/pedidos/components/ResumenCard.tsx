interface ResumenCardProps {
  titulo: string
  valor: string
  detalle?: string
  tono?: 'neutro' | 'ambar' | 'cielo' | 'verde' | 'gris'
}

const tonos = {
  neutro: 'border-l-brand-600',
  ambar: 'border-l-amber-500',
  cielo: 'border-l-sky-500',
  verde: 'border-l-emerald-500',
  gris: 'border-l-stone-400',
} as const

export function ResumenCard({ titulo, valor, detalle, tono = 'neutro' }: ResumenCardProps) {
  return (
    <div className={`rounded-xl border border-stone-200 border-l-4 bg-white p-5 shadow-sm ${tonos[tono]}`}>
      <p className="text-sm font-medium text-stone-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-stone-500">{detalle}</p>}
    </div>
  )
}
