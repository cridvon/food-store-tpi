import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '../store/authStore'

/**
 * Rutas del flujo de compra (carrito). Son públicas para visitantes y clientes,
 * pero el administrador no compra: se lo manda a su panel.
 */
export function ClienteRoute() {
  const usuario = useAuthStore((s) => s.usuario)

  if (usuario?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
