// src/App.tsx
import React from 'react'
import { useAuth } from './hooks/useAuth'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Inicializando sistema...</div>
          <div className="text-slate-400 text-sm mt-2">Conectando con la base de datos...</div>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <Auth />
}

export default App