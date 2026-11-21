import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  imagen_url: string | null
  stock: number // stock conocido al agregarlo; el backend valida el real
}

export type ProductoParaCarrito = Omit<ItemCarrito, 'cantidad'>

interface CartState {
  items: ItemCarrito[]
  agregar: (producto: ProductoParaCarrito, cantidad?: number) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
  cantidadTotal: () => number
}

const limitar = (cantidad: number, stock: number) => Math.max(1, Math.min(cantidad, Math.max(stock, 1)))

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === producto.producto_id)
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === producto.producto_id
                  ? { ...i, ...producto, cantidad: limitar(i.cantidad + cantidad, producto.stock) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...producto, cantidad: limitar(cantidad, producto.stock) }] }
        }),

      quitar: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.producto_id === productoId ? { ...i, cantidad: limitar(cantidad, i.stock) } : i,
          ),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((suma, i) => suma + i.precio_unitario * i.cantidad, 0),

      cantidadTotal: () => get().items.reduce((suma, i) => suma + i.cantidad, 0),
    }),
    { name: 'foodstore-carrito' },
  ),
)
