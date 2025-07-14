import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type LocalUser = {
  id: string
  email: string
  username: string
  createdAt: string
}

export function useLocalAuth() {
  const [currentUser, setCurrentUser] = useLocalStorage<LocalUser | null>('taker_user', null)
  const [users, setUsers] = useLocalStorage<LocalUser[]>('taker_users', [])
  const [loading, setLoading] = useState(false)

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true)
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      setLoading(false)
      return { data: null, error: { message: 'El usuario ya existe' } }
    }

    const newUser: LocalUser = {
      id: Date.now().toString(),
      email,
      username,
      createdAt: new Date().toISOString()
    }

    setUsers([...users, newUser])
    setCurrentUser(newUser)
    setLoading(false)
    
    return { data: { user: newUser }, error: null }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = users.find(u => u.email === email)
    if (!user) {
      setLoading(false)
      return { data: null, error: { message: 'Usuario no encontrado' } }
    }

    setCurrentUser(user)
    setLoading(false)
    
    return { data: { user }, error: null }
  }

  const signOut = async () => {
    setCurrentUser(null)
    return { error: null }
  }

  return {
    user: currentUser,
    loading,
    signUp,
    signIn,
    signOut,
  }
}