export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} />
}

/** Grilla de tarjetas vacías mientras carga el catálogo. */
export function SkeletonGrilla({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <Skeleton className="h-40 rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Filas vacías mientras carga una tabla o lista. */
export function SkeletonFilas({ cantidad = 5 }: { cantidad?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  )
}
