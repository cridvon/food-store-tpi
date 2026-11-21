import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { Button } from '../../../shared/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'
import type { Usuario } from '../types/usuario'

export function AdminUsuariosPage() {
  const usuarios = useUsuarios()
  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const sesionId = useAuthStore((s) => s.usuario?.id)
  const [error, setError] = useState<string | null>(null)

  const columnas = useMemo<ColumnDef<Usuario>[]>(() => {
    const ejecutar = async (accion: () => Promise<unknown>) => {
      setError(null)
      try {
        await accion()
      } catch (e) {
        setError(handleApiError(e))
      }
    }

    return [
      { accessorKey: 'username', header: 'Usuario' },
      { accessorKey: 'full_name', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              row.original.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {row.original.role === 'admin' ? 'Admin' : 'Cliente'}
          </span>
        ),
      },
      {
        accessorKey: 'disabled',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="text-red-700">Desactivado</span>
          ) : (
            <span className="text-emerald-700">Activo</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          if (u.disabled) {
            return (
              <Button tamano="sm" variante="secundario" onClick={() => void ejecutar(() => activar.mutateAsync(u.id))}>
                Activar
              </Button>
            )
          }
          // El admin no puede desactivarse a sí mismo: no se muestra el botón en su fila
          if (u.id === sesionId) return <span className="text-xs text-stone-400">Tu cuenta</span>
          return (
            <Button tamano="sm" variante="peligro" onClick={() => void ejecutar(() => desactivar.mutateAsync(u.id))}>
              Desactivar
            </Button>
          )
        },
      },
    ]
  }, [activar, desactivar, sesionId])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <MensajeError mensaje={error} />
      {usuarios.isPending ? (
        <SkeletonFilas />
      ) : usuarios.isError ? (
        <EstadoError error={usuarios.error} onReintentar={() => void usuarios.refetch()} />
      ) : (
        <TablaDatos
          datos={usuarios.data}
          columnas={columnas}
          placeholderBusqueda="Buscar por usuario, nombre o email…"
          mensajeVacio="No hay usuarios"
        />
      )}
    </div>
  )
}
