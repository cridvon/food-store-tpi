import { useState } from 'react'

interface ProductoImagenProps {
  url: string | null
  nombre: string
  className?: string
}

/** Muestra la imagen del producto; si no hay URL o no carga, muestra la inicial. */
export function ProductoImagen({ url, nombre, className = '' }: ProductoImagenProps) {
  const [fallo, setFallo] = useState(false)

  if (!url || fallo) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-3xl font-bold text-brand-700 ${className}`}
        aria-label={nombre}
        role="img"
      >
        {nombre.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img src={url} alt={nombre} loading="lazy" onError={() => setFallo(true)} className={`bg-stone-100 object-cover ${className}`} />
  )
}
