import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tamano = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  cargando?: boolean
}

const estilos: Record<Variante, string> = {
  primario: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secundario: 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100',
  peligro: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  fantasma: 'text-stone-600 hover:bg-stone-100',
}

const tamanos: Record<Tamano, string> = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-4 py-2',
}

export function Button({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${estilos[variante]} ${tamanos[tamano]} ${className}`}
      {...props}
    >
      {cargando && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
