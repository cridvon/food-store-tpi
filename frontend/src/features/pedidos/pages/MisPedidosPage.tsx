import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Modal } from '../../../shared/ui/Modal'
import { formatFecha, formatPrecio } from '../../../shared/utils/formato'
import { useAuthStore } from '../../../store/authStore'
import { PedidoModal } from '../components/PedidoModal'
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types/pedido'

const POR_PAGINA = 10

export function MisPedidosPage() {
  const location = useLocation()
  const usuarioId = useAuthStore((s) => s.usuario?.id)
  const creado = (location.state as { creado?: number } | null)?.creado
  const [pagina, setPagina] = useState(0)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pedidos = usePedidos({ skip: pagina * POR_PAGINA, limit: POR_PAGINA })
  const cancelar = useCancelarPedido()

  // Solo se ofrece cancelar un pedido propio y PENDIENTE (RN-04)
  const puedeCancelar = (p: Pedido) => p.usuario_id === usuarioId && p.estado === 'PENDIENTE'

  const abrirCancelacion = (p: Pedido) => {
    setError(null)
    setACancelar(p)
  }

  const cerrarCancelacion = () => {
    setError(null)
    setACancelar(null)
  }

  const confirmarCancelacion = async () => {
    if (!aCancelar) return
    setError(null)
    try {
      await cancelar.mutateAsync(aCancelar.id)
      cerrarCancelacion()
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const totalPaginas = pedidos.data ? Math.ceil(pedidos.data.total / POR_PAGINA) : 0

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>

      {creado && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          ¡Listo! Tu pedido #{creado} quedó registrado y está pendiente de preparación.
        </p>
      )}

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : pedidos.data.items.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/" className="font-medium text-brand-700 hover:underline">
              Ver el catálogo
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {pedidos.data.items.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Pedido #{p.id}</span>
                    <BadgeEstado estado={p.estado} />
                  </div>
                  <p className="mt-1 truncate text-sm text-stone-500">
                    {formatFecha(p.created_at)} ·{' '}
                    {p.items.map((i) => `${i.cantidad} × ${i.nombre_producto}`).join(', ')}
                  </p>
                </div>
                <span className="text-lg font-bold tabular-nums">{formatPrecio(p.total)}</span>
                <div className="flex gap-2">
                  <Button variante="secundario" tamano="sm" onClick={() => setDetalleId(p.id)}>
                    Ver detalle
                  </Button>
                  {puedeCancelar(p) && (
                    <Button variante="peligro" tamano="sm" onClick={() => abrirCancelacion(p)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      <PedidoModal
        pedidoId={detalleId}
        onCerrar={() => setDetalleId(null)}
        acciones={(pedido) =>
          puedeCancelar(pedido) ? (
            <Button
              variante="peligro"
              onClick={() => {
                setDetalleId(null)
                abrirCancelacion(pedido)
              }}
            >
              Cancelar pedido
            </Button>
          ) : null
        }
      />

      <Modal titulo="Cancelar pedido" abierto={aCancelar !== null} onCerrar={cerrarCancelacion}>
        <p>
          ¿Querés cancelar el pedido #{aCancelar?.id}? Los productos vuelven al stock y no se puede deshacer.
        </p>
        <div className="mt-4">
          <MensajeError mensaje={error} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={cerrarCancelacion}>
            Volver
          </Button>
          <Button variante="peligro" cargando={cancelar.isPending} onClick={() => void confirmarCancelacion()}>
            Sí, cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
