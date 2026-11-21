import { useEffect, useState } from 'react'

/** Devuelve el valor después de que deja de cambiar durante `ms` milisegundos. */
export function useDebounce<T>(valor: T, ms = 350): T {
  const [demorado, setDemorado] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setDemorado(valor), ms)
    return () => clearTimeout(id)
  }, [valor, ms])

  return demorado
}
