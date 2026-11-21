import { Button } from '../../../shared/ui/Button'
import { formatPrecio } from '../../../shared/utils/formato'
import { useCartStore } from '../../../store/cartStore'
import type { Producto } from '../types/producto'
import { ProductoImagen } from './ProductoImagen'

export function ProductoCard({ producto }: { producto: Producto }) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)

  const sinStock = producto.stock === 0
  const noDisponible = !producto.disponible
  const tope = enCarrito >= producto.stock
  const deshabilitado = sinStock || noDisponible || tope

  const textoBoton = noDisponible
    ? 'No disponible'
    : sinStock
      ? 'Sin stock'
      : tope
        ? 'Máximo en el carrito'
        : 'Agregar al carrito'

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <ProductoImagen url={producto.imagen_url} nombre={producto.nombre} className="h-40 w-full" />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700">
          {producto.categoria.nombre}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-tight">{producto.nombre}</h3>
        {producto.descripcion && <p className="line-clamp-2 text-sm text-stone-500">{producto.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-lg font-bold text-stone-900">{formatPrecio(producto.precio_base)}</span>
          <span className={`text-xs ${producto.stock <= 5 ? 'text-amber-700' : 'text-stone-500'}`}>
            {sinStock ? 'Sin stock' : `Stock: ${producto.stock}`}
          </span>
        </div>
        <Button
          disabled={deshabilitado}
          onClick={() =>
            agregar({
              producto_id: producto.id,
              nombre: producto.nombre,
              precio_unitario: producto.precio_base,
              imagen_url: producto.imagen_url,
              stock: producto.stock,
            })
          }
        >
          {textoBoton}
        </Button>
        {enCarrito > 0 && <p className="text-center text-xs text-brand-700">{enCarrito} en el carrito</p>}
      </div>
    </article>
  )
}
