import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { formatPrecio } from '../../../shared/utils/formato'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { ProductoImagen } from '../components/ProductoImagen'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto'

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }
  | null

export function AdminProductosPage() {
  // El panel pide hasta 100 productos y pagina en el cliente
  const productos = useProductos({ skip: 0, limit: 100 })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const actualizarStock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abrir = (d: Dialogo) => {
    setErrorDialogo(null)
    setDialogo(d)
  }

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setErrorDialogo(null)
    try {
      await accion()
      setDialogo(null)
    } catch (e) {
      setErrorDialogo(handleApiError(e))
    }
  }

  const guardarProducto = (datos: ProductoCreate) =>
    ejecutar(() =>
      dialogo?.tipo === 'editar'
        ? actualizar.mutateAsync({ id: dialogo.producto.id, datos })
        : crear.mutateAsync(datos),
    )

  const guardarStock = (datos: ProductoStockUpdate) =>
    ejecutar(() =>
      dialogo?.tipo === 'stock' ? actualizarStock.mutateAsync({ id: dialogo.producto.id, datos }) : Promise.resolve(),
    )

  const confirmarEliminacion = async () => {
    if (dialogo?.tipo !== 'eliminar') return
    setError(null)
    try {
      await eliminar.mutateAsync(dialogo.producto.id)
    } catch (e) {
      setError(handleApiError(e))
    }
    setDialogo(null)
  }

  const columnas = useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Producto',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductoImagen
              url={row.original.imagen_url}
              nombre={row.original.nombre}
              className="size-10 shrink-0 rounded-md text-base"
            />
            <span className="font-medium">{row.original.nombre}</span>
          </div>
        ),
      },
      { id: 'categoria', header: 'Categoría', accessorFn: (p) => p.categoria.nombre },
      {
        accessorKey: 'precio_base',
        header: 'Precio',
        cell: ({ row }) => <span className="tabular-nums">{formatPrecio(row.original.precio_base)}</span>,
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <span className={`tabular-nums ${row.original.stock === 0 ? 'font-semibold text-red-700' : ''}`}>
            {row.original.stock}
          </span>
        ),
      },
      {
        accessorKey: 'disponible',
        header: 'Disponible',
        cell: ({ row }) =>
          row.original.disponible ? <span className="text-emerald-700">Sí</span> : <span className="text-stone-500">No</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            <Button tamano="sm" variante="secundario" onClick={() => abrir({ tipo: 'editar', producto: row.original })}>
              Editar
            </Button>
            <Button tamano="sm" variante="secundario" onClick={() => abrir({ tipo: 'stock', producto: row.original })}>
              Stock
            </Button>
            <Button tamano="sm" variante="peligro" onClick={() => abrir({ tipo: 'eliminar', producto: row.original })}>
              Dar de baja
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const formAbierto = dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button onClick={() => abrir({ tipo: 'crear' })} disabled={!categorias.data?.length}>
          + Nuevo producto
        </Button>
      </div>

      <MensajeError mensaje={error} />

      {productos.isPending ? (
        <SkeletonFilas />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : (
        <TablaDatos
          datos={productos.data.items}
          columnas={columnas}
          placeholderBusqueda="Buscar por nombre o categoría…"
          mensajeVacio="No hay productos activos"
        />
      )}

      <Modal
        titulo={dialogo?.tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        abierto={formAbierto}
        onCerrar={() => setDialogo(null)}
        ancho="lg"
      >
        {formAbierto && (
          <ProductoForm
            key={dialogo.tipo === 'editar' ? dialogo.producto.id : 'nuevo'}
            inicial={dialogo.tipo === 'editar' ? dialogo.producto : null}
            categorias={categorias.data ?? []}
            error={errorDialogo}
            onGuardar={guardarProducto}
            onCancelar={() => setDialogo(null)}
          />
        )}
      </Modal>

      <Modal titulo="Stock y disponibilidad" abierto={dialogo?.tipo === 'stock'} onCerrar={() => setDialogo(null)}>
        {dialogo?.tipo === 'stock' && (
          <StockForm
            key={dialogo.producto.id}
            producto={dialogo.producto}
            error={errorDialogo}
            onGuardar={guardarStock}
            onCancelar={() => setDialogo(null)}
          />
        )}
      </Modal>

      <Modal titulo="Dar de baja el producto" abierto={dialogo?.tipo === 'eliminar'} onCerrar={() => setDialogo(null)}>
        {dialogo?.tipo === 'eliminar' && (
          <>
            <p>
              ¿Dar de baja «{dialogo.producto.nombre}»? Deja de mostrarse en el catálogo. Los pedidos anteriores conservan
              sus datos.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variante="secundario" onClick={() => setDialogo(null)}>
                Volver
              </Button>
              <Button variante="peligro" cargando={eliminar.isPending} onClick={() => void confirmarEliminacion()}>
                Dar de baja
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
