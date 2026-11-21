import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Paginacion } from './Paginacion'

interface TablaDatosProps<T> {
  datos: T[]
  columnas: ColumnDef<T>[]
  buscable?: boolean
  placeholderBusqueda?: string
  mensajeVacio?: string
  filasPorPagina?: number
}

/** Tabla del panel con TanStack Table: orden, búsqueda y paginación del lado del cliente. */
export function TablaDatos<T>({
  datos,
  columnas,
  buscable = true,
  placeholderBusqueda = 'Buscar…',
  mensajeVacio = 'No hay registros',
  filasPorPagina = 10,
}: TablaDatosProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filtroGlobal, setFiltroGlobal] = useState('')

  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting, globalFilter: filtroGlobal },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltroGlobal,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: filasPorPagina } },
  })

  const filas = tabla.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      {buscable && (
        <input
          type="search"
          aria-label="Buscar en la tabla"
          placeholder={placeholderBusqueda}
          value={filtroGlobal}
          onChange={(e) => {
            setFiltroGlobal(e.target.value)
            tabla.setPageIndex(0)
          }}
          className="w-full max-w-xs rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-600">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((header) => {
                  const ordenable = header.column.getCanSort()
                  const orden = header.column.getIsSorted()
                  return (
                    <th key={header.id} className="whitespace-nowrap px-4 py-3 font-medium">
                      {header.isPlaceholder ? null : ordenable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-stone-900"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden="true">{orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '↕'}</span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-10 text-center text-stone-500">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id} className="border-t border-stone-100 hover:bg-stone-50">
                  {fila.getVisibleCells().map((celda) => (
                    <td key={celda.id} className="px-4 py-3 align-middle">
                      {flexRender(celda.column.columnDef.cell, celda.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Paginacion
        pagina={tabla.getState().pagination.pageIndex}
        totalPaginas={tabla.getPageCount()}
        onCambiar={(p) => tabla.setPageIndex(p)}
      />
    </div>
  )
}
