import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { formatPrecio } from '../../../shared/utils/formato'
import { ResumenCard } from '../components/ResumenCard'
import { useResumenPedidos } from '../hooks/usePedidos'

export function AdminResumenPage() {
  const resumen = useResumenPedidos()

  if (resumen.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  if (resumen.isError) {
    return <EstadoError error={resumen.error} onReintentar={() => void resumen.refetch()} />
  }

  const r = resumen.data
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Resumen del negocio</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResumenCard titulo="Pedidos de hoy" valor={String(r.pedidos_hoy)} detalle="Creados desde las 00:00" />
        <ResumenCard
          titulo="Ingresos entregados"
          valor={formatPrecio(r.ingresos_entregados)}
          detalle="Suma de los pedidos entregados"
          tono="verde"
        />
        <ResumenCard titulo="Pendientes" valor={String(r.pendientes)} detalle="Esperan preparación" tono="ambar" />
        <ResumenCard titulo="En preparación" valor={String(r.en_preparacion)} tono="cielo" />
        <ResumenCard titulo="Entregados" valor={String(r.entregados)} tono="verde" />
        <ResumenCard titulo="Cancelados" valor={String(r.cancelados)} tono="gris" />
      </div>
    </div>
  )
}
