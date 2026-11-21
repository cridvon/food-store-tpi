import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { formatFecha, formatPrecio } from '../../../shared/utils/formato'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'
import { PedidoModal } from '../components/PedidoModal'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ESTADOS, type EstadoPedido, NOMBRE_ESTADO, type Pedido, TRANSICIONES } from '../types/pedido'

const TEXTO_ACCION: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparar',
  ENTREGADO: 'Entregar',
  CANCELADO: 'Cancelar',
}

export function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // El panel pide hasta 100 pedidos y pagina en el cliente
  const pedidos = usePedidos({ skip: 0, limit: 100, estado })
  const usuarios = useUsuarios()
  const cambiarEstado = useCambiarEstadoPedido()

  const nombreUsuario = useMemo(() => {
    const mapa = new Map<number, string>()
    usuarios.data?.forEach((u) => mapa.set(u.id, u.username))
    return mapa
  }, [usuarios.data])

  const accionar = async (id: number, nuevo: EstadoPedido) => {
    setError(null)
    try {
      await cambiarEstado.mutateAsync({ id, estado: nuevo })
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const botonesDeEstado = (pedido: Pedido) =>
    TRANSICIONES[pedido.estado].map((destino) => (
      <Button
        key={destino}
        tamano="sm"
        variante={destino === 'CANCELADO' ? 'peligro' : 'primario'}
        disabled={cambiarEstado.isPending}
        onClick={() => void accionar(pedido.id, destino)}
      >
        {TEXTO_ACCION[destino]}
      </Button>
    ))

  const columnas = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { accessorKey: 'id', header: '#' },
      {
        accessorKey: 'created_at',
        header: 'Fecha',
        cell: ({ row }) => formatFecha(row.original.created_at),
      },
      {
        id: 'cliente',
        header: 'Cliente',
        accessorFn: (p) => nombreUsuario.get(p.usuario_id) ?? `Usuario ${p.usuario_id}`,
      },
      {
        accessorKey: 'forma_pago',
        header: 'Pago',
        cell: ({ row }) => (row.original.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => <span className="tabular-nums">{formatPrecio(row.original.total)}</span>,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => <BadgeEstado estado={row.original.estado} />,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            <Button variante="secundario" tamano="sm" onClick={() => setDetalleId(row.original.id)}>
              Ver
            </Button>
            {botonesDeEstado(row.original)}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nombreUsuario, cambiarEstado.isPending],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div>
          <label htmlFor="filtro-estado" className="text-sm font-medium text-stone-700">
            Estado
          </label>
          <select
            id="filtro-estado"
            value={estado ?? ''}
            onChange={(e) => setEstado(e.target.value ? (e.target.value as EstadoPedido) : undefined)}
            className="ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MensajeError mensaje={error} />

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : (
        <TablaDatos
          datos={pedidos.data.items}
          columnas={columnas}
          placeholderBusqueda="Buscar por cliente, número…"
          mensajeVacio={estado ? `No hay pedidos ${NOMBRE_ESTADO[estado].toLowerCase()}` : 'Todavía no hay pedidos'}
        />
      )}

      <PedidoModal
        pedidoId={detalleId}
        onCerrar={() => setDetalleId(null)}
        acciones={(pedido) => botonesDeEstado(pedido)}
      />
    </div>
  )
}
