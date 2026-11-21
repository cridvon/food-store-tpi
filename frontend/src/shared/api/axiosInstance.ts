import axios from 'axios'

export const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

/**
 * Cliente HTTP único. withCredentials hace que el navegador adjunte la cookie
 * HttpOnly con el JWT: el frontend nunca lee ni guarda el token.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  withCredentials: true,
})

type AlInvalidarSesion = () => void
let alInvalidarSesion: AlInvalidarSesion | null = null

/** El authStore registra aquí cómo limpiar la sesión (evita una importación circular). */
export function registrarSesionInvalida(callback: AlInvalidarSesion): void {
  alInvalidarSesion = callback
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const url = error.config?.url ?? ''
      const { status, data } = error.response
      const detail = (data as { detail?: unknown } | undefined)?.detail
      // El 401 del login y de /auth/me se manejan en el formulario y en checkSession
      const esRutaDeSesion = url.includes('/auth/token') || url.includes('/auth/me')
      const sesionVencida = status === 401 && !esRutaDeSesion
      const cuentaDesactivada = status === 400 && detail === CUENTA_DESACTIVADA
      if (sesionVencida || cuentaDesactivada) {
        alInvalidarSesion?.()
      }
    }
    return Promise.reject(error)
  },
)
