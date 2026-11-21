import type { ReactNode } from 'react'

import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Modal } from '../../../shared/ui/Modal'
import { usePedido } from '../hooks/usePedidos'
import type { Pedido } from '../types/pedido'
import { PedidoDetalle } from './PedidoDetalle'

interface PedidoModalProps {
  pedidoId: number | null
  onCerrar: () => void
  acciones?: (pedido: Pedido) => ReactNode
}

/** Detalle de un pedido obtenido con GET /pedidos/{id}. */
export function PedidoModal({ pedidoId, onCerrar, acciones }: PedidoModalProps) {
  const pedido = usePedido(pedidoId)

  return (
    <Modal titulo={`Pedido #${pedidoId ?? ''}`} abierto={pedidoId !== null} onCerrar={onCerrar} ancho="lg">
      {pedido.isPending ? (
        <SkeletonFilas cantidad={4} />
      ) : pedido.isError ? (
        <EstadoError error={pedido.error} onReintentar={() => void pedido.refetch()} />
      ) : (
        <div className="flex flex-col gap-5">
          <PedidoDetalle pedido={pedido.data} />
          {acciones && <div className="flex flex-wrap justify-end gap-2">{acciones(pedido.data)}</div>}
        </div>
      )}
    </Modal>
  )
}
