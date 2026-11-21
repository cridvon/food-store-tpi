import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const enlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
  }`

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((suma, i) => suma + i.cantidad, 0))
  const navigate = useNavigate()

  const cerrarSesion = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-bold text-brand-700 sm:mr-2">
          <img src="/favicon.svg" alt="" className="size-7" />
          Food Store
        </Link>

        <nav className="order-last flex w-full flex-wrap items-center gap-1 sm:order-none sm:w-auto sm:flex-1">
          <NavLink to="/" end className={enlace}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={enlace}>
            Carrito
            {cantidad > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white tabular-nums">
                {cantidad}
              </span>
            )}
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={enlace}>
              Mis pedidos
            </NavLink>
          )}
          {usuario?.role === 'admin' && (
            <NavLink to="/admin" className={enlace}>
              Panel admin
            </NavLink>
          )}
        </nav>

        {usuario ? (
          <div className="flex items-center gap-3">
            <span className="text-right text-sm leading-tight">
              <span className="block font-medium">{usuario.full_name}</span>
              <span className="block text-xs text-stone-500">
                {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-stone-100">
              Ingresar
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
