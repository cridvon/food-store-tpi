import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cambiarEstado,
  cancelarPedido,
  crearPedido,
  listarPedidos,
  obtenerPedido,
  obtenerResumen,
} from '../api/pedidos'
import type { EstadoPedido, FiltrosPedidos, PedidoCreate } from '../types/pedido'

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: ['pedidos', 'lista', filtros],
    queryFn: () => listarPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function usePedido(id: number | null) {
  return useQuery({
    queryKey: ['pedidos', 'detalle', id],
    queryFn: () => obtenerPedido(id as number),
    enabled: id !== null,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: ['pedidos', 'resumen'], queryFn: obtenerResumen })
}

/** Un pedido cambia el stock: se invalidan pedidos y productos. */
function useInvalidarPedidosYProductos() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    void queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYProductos()
  return useMutation({ mutationFn: (datos: PedidoCreate) => crearPedido(datos), onSuccess: invalidar })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYProductos()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    // onSettled: también ante un error (por ejemplo, el pedido ya cambió de estado) se vuelve a
    // pedir el dato al backend, así la pantalla nunca muestra un estado viejo
    onSettled: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYProductos()
  return useMutation({ mutationFn: (id: number) => cancelarPedido(id), onSettled: invalidar })
}
