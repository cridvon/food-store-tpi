import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
  listarCategoriasInactivas,
  reactivarCategoria,
} from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const categoriasKey = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: categoriasKey, queryFn: listarCategorias })
}

/** Dadas de baja: solo se piden cuando el admin activa «Mostrar dadas de baja». */
export function useCategoriasInactivas(habilitado: boolean) {
  return useQuery({
    queryKey: [...categoriasKey, 'inactivas'],
    queryFn: listarCategoriasInactivas,
    enabled: habilitado,
  })
}

export function useReactivarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reactivarCategoria(id),
    // Invalida activas e inactivas (las dos cuelgan de ['categorias'])
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoriasKey }),
  })
}

export function useCrearCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: CategoriaCreate) => crearCategoria(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriasKey }),
  })
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaUpdate }) => actualizarCategoria(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriasKey })
      // Los productos muestran el nombre de su categoría
      void queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriasKey }),
  })
}
