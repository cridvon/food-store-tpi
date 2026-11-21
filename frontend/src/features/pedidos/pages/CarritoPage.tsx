import { Link, useNavigate } from 'react-router-dom'

import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/formato'
import { useAuthStore } from '../../../store/authStore'
import { useCartStore } from '../../../store/cartStore'
import { ProductoImagen } from '../../productos/components/ProductoImagen'

export function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const quitar = useCartStore((s) => s.quitar)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        mensaje="Agregá productos desde el catálogo."
        accion={
          <Link to="/" className="font-medium text-brand-700 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Carrito</h1>
          <Button variante="fantasma" tamano="sm" onClick={vaciar}>
            Vaciar carrito
          </Button>
        </div>

        {items.map((item) => (
          <Card key={item.producto_id} className="flex items-center gap-4 p-3">
            <ProductoImagen url={item.imagen_url} nombre={item.nombre} className="size-16 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.nombre}</p>
              <p className="text-sm text-stone-500">{formatPrecio(item.precio_unitario)} c/u</p>
            </div>
            <div className="flex items-center gap-1" aria-label={`Cantidad de ${item.nombre}`}>
              <Button
                variante="secundario"
                tamano="sm"
                aria-label="Restar uno"
                disabled={item.cantidad <= 1}
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
              >
                −
              </Button>
              <span className="w-8 text-center tabular-nums">{item.cantidad}</span>
              <Button
                variante="secundario"
                tamano="sm"
                aria-label="Sumar uno"
                disabled={item.cantidad >= item.stock}
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
              >
                +
              </Button>
            </div>
            <p className="w-28 text-right font-semibold tabular-nums">
              {formatPrecio(item.precio_unitario * item.cantidad)}
            </p>
            <Button variante="fantasma" tamano="sm" aria-label={`Quitar ${item.nombre}`} onClick={() => quitar(item.producto_id)}>
              Quitar
            </Button>
          </Card>
        ))}
      </section>

      <Card className="h-fit p-5">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <div key={i.producto_id} className="flex justify-between gap-2">
              <dt className="truncate text-stone-600">
                {i.cantidad} × {i.nombre}
              </dt>
              <dd className="tabular-nums">{formatPrecio(i.precio_unitario * i.cantidad)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrecio(total)}</dd>
          </div>
        </dl>
        <Button className="mt-5 w-full" onClick={() => navigate('/checkout')}>
          {usuario ? 'Confirmar pedido' : 'Ingresar para confirmar'}
        </Button>
        <p className="mt-2 text-center text-xs text-stone-500">El precio final se confirma al crear el pedido.</p>
      </Card>
    </div>
  )
}
