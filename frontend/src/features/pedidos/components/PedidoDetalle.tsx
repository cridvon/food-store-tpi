import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { formatFecha, formatPrecio } from '../../../shared/utils/formato'
import type { Pedido } from '../types/pedido'

const FORMA_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const

export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <BadgeEstado estado={pedido.estado} />
        <span className="text-sm text-stone-500">Creado el {formatFecha(pedido.created_at)}</span>
        {pedido.updated_at !== pedido.created_at && (
          <span className="text-sm text-stone-500">· Actualizado el {formatFecha(pedido.updated_at)}</span>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-stone-500">Entrega</dt>
        <dd>{pedido.direccion_entrega}</dd>
        <dt className="text-stone-500">Pago</dt>
        <dd>{FORMA_PAGO[pedido.forma_pago]}</dd>
        {pedido.notas && (
          <>
            <dt className="text-stone-500">Notas</dt>
            <dd>{pedido.notas}</dd>
          </>
        )}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 text-left text-stone-500">
            <tr>
              <th className="py-2 font-medium">Producto</th>
              <th className="py-2 text-right font-medium">Precio</th>
              <th className="py-2 text-right font-medium">Cant.</th>
              <th className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((linea) => (
              <tr key={linea.producto_id} className="border-b border-stone-100">
                <td className="py-2">{linea.nombre_producto}</td>
                <td className="py-2 text-right tabular-nums">{formatPrecio(linea.precio_unitario)}</td>
                <td className="py-2 text-right tabular-nums">{linea.cantidad}</td>
                <td className="py-2 text-right tabular-nums">{formatPrecio(linea.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-3 text-right font-semibold">
                Total
              </td>
              <td className="pt-3 text-right text-base font-bold tabular-nums">{formatPrecio(pedido.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
