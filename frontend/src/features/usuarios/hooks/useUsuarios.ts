import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activarUsuario, desactivarUsuario, listarUsuarios } from '../api/usuarios'

export const usuariosKey = ['usuarios'] as const

export function useUsuarios() {
  return useQuery({ queryKey: usuariosKey, queryFn: listarUsuarios })
}

export function useActivarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKey }),
  })
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => desactivarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKey }),
  })
}
