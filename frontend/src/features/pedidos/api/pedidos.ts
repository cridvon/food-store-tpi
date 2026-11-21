import { api } from '../../../shared/api/axiosInstance'
import type {
  EstadoPedido,
  FiltrosPedidos,
  Pedido,
  PedidoCreate,
  PedidosPaginados,
  ResumenPedidos,
} from '../types/pedido'

export async function crearPedido(datos: PedidoCreate): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/pedidos', datos)
  return data
}

export async function listarPedidos(filtros: FiltrosPedidos): Promise<PedidosPaginados> {
  const params = filtros.estado ? filtros : { skip: filtros.skip, limit: filtros.limit }
  const { data } = await api.get<PedidosPaginados>('/pedidos', { params })
  return data
}

export async function obtenerPedido(id: number): Promise<Pedido> {
  const { data } = await api.get<Pedido>(`/pedidos/${id}`)
  return data
}

export async function obtenerResumen(): Promise<ResumenPedidos> {
  const { data } = await api.get<ResumenPedidos>('/pedidos/resumen')
  return data
}

export async function cambiarEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })
  return data
}

export async function cancelarPedido(id: number): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/cancelar`)
  return data
}
