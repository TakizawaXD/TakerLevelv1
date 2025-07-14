import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface SignUpData {
  username: string
  full_name?: string | null
  phone?: string | null
  date_of_birth?: string | null
  gender?: 'male' | 'female' | 'other'
  height_cm?: number | null
  weight_kg?: number | null
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (data.user && !error) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          auth_user_id: data.user.id,
          email,
          username: userData.username,
          full_name: userData.full_name,
          phone: userData.phone,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender,
          height_cm: userData.height_cm,
          weight_kg: userData.weight_kg,
          fitness_level: userData.fitness_level || 'beginner',
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
          current_streak: 0,
          max_streak: 0,
          total_workouts: 0,
          total_missions_completed: 0,
          title: 'Cazador Novato',
          rank: 'E'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { data, error: profileError }
      }

      // Generate initial daily missions and boss raids
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .single()

      if (userData) {
        await supabase.rpc('generate_daily_missions', { user_uuid: userData.id })
        await supabase.rpc('create_initial_boss_raids', { user_uuid: userData.id })
      }
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }
}