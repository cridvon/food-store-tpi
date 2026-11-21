import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/formato'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm, type DatosCheckout } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore((s) => s.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0 && !crearPedido.isSuccess) {
    return <Navigate to="/carrito" replace />
  }

  const confirmar = async (datos: DatosCheckout) => {
    setError(null)
    try {
      const pedido = await crearPedido.mutateAsync({
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        forma_pago: datos.forma_pago,
        direccion_entrega: datos.direccion_entrega.trim(),
        notas: datos.notas.trim() || null,
      })
      vaciar()
      navigate('/mis-pedidos', { replace: true, state: { creado: pedido.id } })
    } catch (e) {
      // Ej.: stock insuficiente si otro cliente compró antes
      setError(handleApiError(e))
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Confirmar pedido</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">Completá los datos de entrega y la forma de pago.</p>
        <CheckoutForm onConfirmar={confirmar} error={error} />
      </Card>

      <Card className="h-fit p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tu pedido</h2>
          <Link to="/carrito" className="text-sm text-brand-700 hover:underline">
            Editar
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.producto_id} className="flex justify-between gap-2">
              <span className="truncate text-stone-600">
                {i.cantidad} × {i.nombre}
              </span>
              <span className="tabular-nums">{formatPrecio(i.precio_unitario * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-stone-200 pt-3 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrecio(total)}</span>
        </div>
      </Card>
    </div>
  )
}
