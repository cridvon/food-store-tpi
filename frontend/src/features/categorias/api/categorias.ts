import { api } from '../../../shared/api/axiosInstance'
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias')
  return data
}

/** Solo admin: categorías dadas de baja. */
export async function listarCategoriasInactivas(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias/inactivas')
  return data
}

export async function reactivarCategoria(id: number): Promise<Categoria> {
  const { data } = await api.patch<Categoria>(`/categorias/${id}/reactivar`)
  return data
}

export async function crearCategoria(datos: CategoriaCreate): Promise<Categoria> {
  const { data } = await api.post<Categoria>('/categorias', datos)
  return data
}

export async function actualizarCategoria(id: number, datos: CategoriaUpdate): Promise<Categoria> {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, datos)
  return data
}

export async function eliminarCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}
