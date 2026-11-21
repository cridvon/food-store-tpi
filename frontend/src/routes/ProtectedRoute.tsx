import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { Rol } from '../features/auth/types/auth'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  roles?: Rol[]
}

/**
 * Sin sesión redirige a /login (y vuelve después); sin el rol, a /unauthorized.
 * Es solo para la experiencia de uso: la protección real está en el backend (require_role).
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex justify-center py-20" aria-busy="true">
        <span className="size-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <span className="sr-only">Verificando la sesión…</span>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
