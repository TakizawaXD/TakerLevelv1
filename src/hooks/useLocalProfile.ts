import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { useLocalAuth } from './useLocalAuth'

export type LocalUserProfile = {
  id: string
  email: string
  username: string
  level: number
  total_xp: number
  current_xp: number
  xp_to_next_level: number
  str: number
  agi: number
  int: number
  vit: number
  cha: number
  available_points: number
  created_at: string
  updated_at: string
}

export function useLocalProfile() {
  const { user } = useLocalAuth()
  const [profiles, setProfiles] = useLocalStorage<LocalUserProfile[]>('taker_profiles', [])
  const [loading, setLoading] = useState(true)

  const profile = profiles.find(p => p.id === user?.id) || null

  useEffect(() => {
    if (user) {
      // Crear perfil si no existe
      const existingProfile = profiles.find(p => p.id === user.id)
      if (!existingProfile) {
        const newProfile: LocalUserProfile = {
          id: user.id,
          email: user.email,
          username: user.username,
          level: 1,
          total_xp: 0,
          current_xp: 0,
          xp_to_next_level: 100,
          str: 1,
          agi: 1,
          int: 1,
          vit: 1,
          cha: 1,
          available_points: 0,
          created_at: user.createdAt,
          updated_at: new Date().toISOString()
        }
        setProfiles([...profiles, newProfile])
      }
    }
    setLoading(false)
  }, [user, profiles, setProfiles])

  const addXP = async (xp: number) => {
    if (!profile) return

    const newTotalXp = profile.total_xp + xp
    let newCurrentXp = profile.current_xp + xp
    let newLevel = profile.level
    let newAvailablePoints = profile.available_points
    let newXpToNext = profile.xp_to_next_level

    // Level up logic
    while (newCurrentXp >= newXpToNext) {
      newCurrentXp -= newXpToNext
      newLevel++
      newAvailablePoints++
      newXpToNext = newLevel * 100 // Each level requires level * 100 XP
    }

    const updatedProfile = {
      ...profile,
      total_xp: newTotalXp,
      current_xp: newCurrentXp,
      level: newLevel,
      available_points: newAvailablePoints,
      xp_to_next_level: newXpToNext,
      updated_at: new Date().toISOString()
    }

    const updatedProfiles = profiles.map(p => 
      p.id === profile.id ? updatedProfile : p
    )
    setProfiles(updatedProfiles)

    return { leveledUp: newLevel > profile.level, newLevel }
  }

  const allocateStatPoint = async (stat: keyof Pick<LocalUserProfile, 'str' | 'agi' | 'int' | 'vit' | 'cha'>) => {
    if (!profile || profile.available_points <= 0) return

    const updatedProfile = {
      ...profile,
      [stat]: profile[stat] + 1,
      available_points: profile.available_points - 1,
      updated_at: new Date().toISOString()
    }

    const updatedProfiles = profiles.map(p => 
      p.id === profile.id ? updatedProfile : p
    )
    setProfiles(updatedProfiles)
  }

  const refreshProfile = async () => {
    // No need to refresh in local storage version
  }

  return {
    profile,
    loading,
    addXP,
    allocateStatPoint,
    refreshProfile,
  }
}