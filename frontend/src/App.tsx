import { useEffect } from 'react'

import { AppRouter } from './routes/AppRouter'
import { useAuthStore } from './store/authStore'

function App() {
  const checkSession = useAuthStore((s) => s.checkSession)

  // Única llamada en un useEffect: confirma la sesión al montar la aplicación
  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return <AppRouter />
}

export default App
