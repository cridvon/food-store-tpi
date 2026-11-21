import { NavLink, Outlet } from 'react-router-dom'

const secciones = [
  { to: '/admin/resumen', texto: 'Resumen' },
  { to: '/admin/pedidos', texto: 'Pedidos' },
  { to: '/admin/productos', texto: 'Productos' },
  { to: '/admin/categorias', texto: 'Categorías' },
  { to: '/admin/usuarios', texto: 'Usuarios' },
]

export function AdminLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Panel de administración</p>
        <nav className="mt-2 flex flex-wrap gap-1 border-b border-stone-200" aria-label="Secciones del panel">
          {secciones.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`
              }
            >
              {s.texto}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
