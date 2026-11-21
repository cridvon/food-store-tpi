import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const categoriasKey = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: categoriasKey, queryFn: listarCategorias })
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
