import type { ReactNode } from 'react'

interface ModalProps {
  titulo: string
  abierto: boolean
  onCerrar: () => void
  children: ReactNode
  ancho?: 'md' | 'lg'
}

export function Modal({ titulo, abierto, onCerrar, children, ancho = 'md' }: ModalProps) {
  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 sm:items-center"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={`w-full ${ancho === 'lg' ? 'max-w-2xl' : 'max-w-md'} rounded-xl bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 id="modal-titulo" className="text-lg font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md px-2 text-xl text-stone-500 hover:bg-stone-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
