import { useState } from 'react'

import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonGrilla } from '../../../shared/components/Skeleton'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { Button } from '../../../shared/ui/Button'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const POR_PAGINA = 8

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const busquedaDemorada = useDebounce(busqueda.trim())

  const categorias = useCategorias()
  const productos = useProductos({
    skip: pagina * POR_PAGINA, // paginado en el servidor
    limit: POR_PAGINA,
    search: busquedaDemorada || undefined,
    categoria_id: categoriaId,
  })

  const totalPaginas = productos.data ? Math.ceil(productos.data.total / POR_PAGINA) : 0
  const hayFiltros = busqueda !== '' || categoriaId !== undefined

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaId(undefined)
    setPagina(0)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-8 text-white">
        <h1 className="text-3xl font-bold">¿Qué vas a pedir hoy?</h1>
        <p className="mt-1 text-brand-50">Elegí tus platos, armá el carrito y pagá en efectivo o transferencia.</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="buscar" className="text-sm font-medium text-stone-700">
            Buscar
          </label>
          <input
            id="buscar"
            type="search"
            placeholder="Hamburguesa, pizza…"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(0)
            }}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="categoria" className="text-sm font-medium text-stone-700">
            Categoría
          </label>
          <select
            id="categoria"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
              setPagina(0)
            }}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
          >
            <option value="">Todas</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        {hayFiltros && (
          <Button variante="fantasma" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {productos.isPending ? (
        <SkeletonGrilla cantidad={POR_PAGINA} />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : productos.data.items.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          mensaje={hayFiltros ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
          accion={hayFiltros ? <Button onClick={limpiarFiltros}>Ver todo el catálogo</Button> : undefined}
        />
      ) : (
        <>
          <p className="text-sm text-stone-500">
            {productos.data.total} {productos.data.total === 1 ? 'producto' : 'productos'}
          </p>
          <div
            className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${productos.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {productos.data.items.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}
    </div>
  )
}
