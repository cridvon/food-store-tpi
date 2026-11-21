import { api } from '../../../shared/api/axiosInstance'
import type { UserCreate, UserPublic } from '../types/auth'

export async function registrar(datos: UserCreate): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/auth/register', datos)
  return data
}

/** Login con formulario OAuth2: la API responde con la cookie HttpOnly, no con el token. */
export async function login(username: string, password: string): Promise<void> {
  const form = new URLSearchParams({ username, password })
  await api.post('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function obtenerPerfil(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/auth/me')
  return data
}
