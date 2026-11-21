import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import * as authApi from '../features/auth/api/auth'
import type { Rol } from '../features/auth/types/auth'
import { registrarSesionInvalida } from '../shared/api/axiosInstance'
import { queryClient } from '../shared/api/queryClient'

/** Datos del usuario de la sesión. El token nunca se guarda: vive en la cookie HttpOnly. */
export interface UsuarioSesion {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
}

interface AuthState {
  usuario: UsuarioSesion | null
  cargando: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiar: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await authApi.login(username, password)
        const perfil = await authApi.obtenerPerfil()
        const { id, full_name, email, role } = perfil
        set({ usuario: { id, username: perfil.username, full_name, email, role }, cargando: false })
      },

      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          set({ usuario: null })
          queryClient.removeQueries({ queryKey: ['pedidos'] })
          queryClient.removeQueries({ queryKey: ['usuarios'] })
        }
      },

      // Se llama una vez al montar la app: confirma con /auth/me si la cookie sigue válida
      checkSession: async () => {
        set({ cargando: true })
        try {
          const perfil = await authApi.obtenerPerfil()
          const { id, username, full_name, email, role } = perfil
          set({ usuario: { id, username, full_name, email, role } })
        } catch {
          set({ usuario: null })
        } finally {
          set({ cargando: false })
        }
      },

      limpiar: () => {
        set({ usuario: null })
        queryClient.removeQueries({ queryKey: ['pedidos'] })
        queryClient.removeQueries({ queryKey: ['usuarios'] })
      },
    }),
    {
      name: 'foodstore-auth',
      // partialize: solo se persiste el usuario, nunca el token ni el estado de carga
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

// El interceptor de Axios limpia la sesión ante un 401 o una cuenta desactivada
registrarSesionInvalida(() => useAuthStore.getState().limpiar())
