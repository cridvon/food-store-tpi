import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import {
  useActualizarCategoria,
  useCategorias,
  useCategoriasInactivas,
  useCrearCategoria,
  useEliminarCategoria,
  useReactivarCategoria,
} from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types/categoria'

type Edicion = { modo: 'crear' } | { modo: 'editar'; categoria: Categoria } | null

export function AdminCategoriasPage() {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()
  const reactivar = useReactivarCategoria()
  const [verInactivas, setVerInactivas] = useState(false)
  const inactivas = useCategoriasInactivas(verInactivas)

  const [edicion, setEdicion] = useState<Edicion>(null)
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abrir = (e: Edicion) => {
    setErrorForm(null)
    setEdicion(e)
  }

  const guardar = async (datos: CategoriaCreate) => {
    setErrorForm(null)
    try {
      if (edicion?.modo === 'editar') {
        await actualizar.mutateAsync({ id: edicion.categoria.id, datos })
      } else {
        await crear.mutateAsync(datos)
      }
      setEdicion(null)
    } catch (e) {
      setErrorForm(handleApiError(e))
    }
  }

  const confirmarEliminacion = async () => {
    if (!aEliminar) return
    setError(null)
    try {
      await eliminar.mutateAsync(aEliminar.id)
    } catch (e) {
      setError(handleApiError(e))
    }
    setAEliminar(null)
  }

  const reactivarMutacion = reactivar.mutateAsync
  const reactivarCategoria = useCallback(
    async (categoria: Categoria) => {
      setError(null)
      try {
        await reactivarMutacion(categoria.id)
      } catch (e) {
        setError(handleApiError(e))
      }
    },
    [reactivarMutacion],
  )

  // Con el interruptor activo se suman las dadas de baja al final de la tabla
  const filas = useMemo(
    () => [...(categorias.data ?? []), ...(verInactivas ? (inactivas.data ?? []) : [])],
    [categorias.data, inactivas.data, verInactivas],
  )

  const columnas = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span className={`font-medium ${row.original.activo ? '' : 'text-stone-400 line-through'}`}>
              {row.original.nombre}
            </span>
            {!row.original.activo && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">Dada de baja</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-stone-600">{row.original.descripcion ?? '—'}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.activo ? (
            <div className="flex gap-1.5">
              <Button tamano="sm" variante="secundario" onClick={() => abrir({ modo: 'editar', categoria: row.original })}>
                Editar
              </Button>
              <Button tamano="sm" variante="peligro" onClick={() => setAEliminar(row.original)}>
                Dar de baja
              </Button>
            </div>
          ) : (
            <Button tamano="sm" variante="secundario" onClick={() => void reactivarCategoria(row.original)}>
              Reactivar
            </Button>
          ),
      },
    ],
    [reactivarCategoria],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => abrir({ modo: 'crear' })}>+ Nueva categoría</Button>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={verInactivas}
          onChange={(e) => setVerInactivas(e.target.checked)}
          className="size-4 accent-brand-600"
        />
        Mostrar dadas de baja
      </label>

      <MensajeError mensaje={error} />

      {categorias.isPending ? (
        <SkeletonFilas />
      ) : categorias.isError ? (
        <EstadoError error={categorias.error} onReintentar={() => void categorias.refetch()} />
      ) : (
        <TablaDatos datos={filas} columnas={columnas} mensajeVacio="No hay categorías activas" />
      )}

      <Modal
        titulo={edicion?.modo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
      >
        <CategoriaForm
          key={edicion?.modo === 'editar' ? edicion.categoria.id : 'nueva'}
          inicial={edicion?.modo === 'editar' ? edicion.categoria : null}
          error={errorForm}
          onGuardar={guardar}
          onCancelar={() => setEdicion(null)}
        />
      </Modal>

      <Modal titulo="Dar de baja la categoría" abierto={aEliminar !== null} onCerrar={() => setAEliminar(null)}>
        <p>
          ¿Dar de baja «{aEliminar?.nombre}»? Deja de aparecer en el catálogo, pero sus productos siguen activos:
          para retirarlos, dalos de baja desde Productos.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setAEliminar(null)}>
            Volver
          </Button>
          <Button variante="peligro" cargando={eliminar.isPending} onClick={() => void confirmarEliminacion()}>
            Dar de baja
          </Button>
        </div>
      </Modal>
    </div>
  )
}
