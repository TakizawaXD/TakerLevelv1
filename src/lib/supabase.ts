import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          username: string
          full_name: string | null
          phone: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          height_cm: number | null
          weight_kg: number | null
          fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
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
          current_streak: number
          max_streak: number
          total_workouts: number
          total_missions_completed: number
          avatar_url: string | null
          title: string
          rank: string
          voice_enabled: boolean
          notifications_enabled: boolean
          daily_mission_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          email: string
          username: string
          full_name?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          height_cm?: number | null
          weight_kg?: number | null
          fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          level?: number
          total_xp?: number
          current_xp?: number
          xp_to_next_level?: number
          str?: number
          agi?: number
          int?: number
          vit?: number
          cha?: number
          available_points?: number
          current_streak?: number
          max_streak?: number
          total_workouts?: number
          total_missions_completed?: number
          avatar_url?: string | null
          title?: string
          rank?: string
          voice_enabled?: boolean
          notifications_enabled?: boolean
          daily_mission_time?: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      daily_missions: {
        Row: {
          id: string
          user_id: string
          date: string
          mission_type: string
          title: string
          description: string
          exercise_type: string | null
          target_value: number
          current_progress: number
          unit: string
          xp_reward: number
          bonus_xp: number
          penalty_xp: number
          completed: boolean
          completed_at: string | null
          penalty_applied: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          date?: string
          mission_type: string
          title: string
          description: string
          exercise_type?: string | null
          target_value: number
          current_progress?: number
          unit?: string
          xp_reward?: number
          bonus_xp?: number
          penalty_xp?: number
          completed?: boolean
          completed_at?: string | null
          penalty_applied?: boolean
        }
        Update: Partial<Database['public']['Tables']['daily_missions']['Insert']>
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: string
          muscle_groups: string[]
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          equipment_needed: string[]
          instructions: string | null
          tips: string | null
          calories_per_rep: number
          xp_multiplier: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          name: string
          category: string
          muscle_groups?: string[]
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          equipment_needed?: string[]
          instructions?: string | null
          tips?: string | null
          calories_per_rep?: number
          xp_multiplier?: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          name: string
          type: string
          intensity: 'low' | 'medium' | 'high' | 'extreme'
          duration_minutes: number
          calories_burned: number
          xp_gained: number
          notes: string
          heart_rate_avg: number | null
          heart_rate_max: number | null
          perceived_exertion: number | null
          completed: boolean
          voice_guided: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          date?: string
          name: string
          type: string
          intensity?: 'low' | 'medium' | 'high' | 'extreme'
          duration_minutes: number
          calories_burned?: number
          xp_gained: number
          notes?: string
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          perceived_exertion?: number | null
          completed?: boolean
          voice_guided?: boolean
        }
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          sets: number
          reps: number
          weight_kg: number | null
          distance_km: number | null
          duration_seconds: number | null
          rest_seconds: number
          notes: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          workout_id: string
          exercise_id: string
          sets?: number
          reps?: number
          weight_kg?: number | null
          distance_km?: number | null
          duration_seconds?: number | null
          rest_seconds?: number
          notes?: string | null
          completed?: boolean
        }
        Update: Partial<Database['public']['Tables']['workout_exercises']['Insert']>
      }
      nutrition_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          quantity: number
          unit: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          is_healthy: boolean
          xp_bonus: number
          created_at: string
        }
        Insert: {
          user_id: string
          date?: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          quantity?: number
          unit?: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          is_healthy?: boolean
          xp_bonus?: number
        }
        Update: Partial<Database['public']['Tables']['nutrition_logs']['Insert']>
      }
      hydration_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          amount_ml: number
          drink_type: string
          time_consumed: string
          created_at: string
        }
        Insert: {
          user_id: string
          date?: string
          amount_ml: number
          drink_type?: string
          time_consumed?: string
        }
        Update: Partial<Database['public']['Tables']['hydration_logs']['Insert']>
      }
      boss_raids: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          boss_type: string
          difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS'
          target_type: string
          target_value: number
          current_progress: number
          reward_type: string
          reward_description: string
          reward_stats: Record<string, number>
          reward_xp: number
          completed: boolean
          unlocked_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          title: string
          description: string
          boss_type?: string
          difficulty?: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS'
          target_type: string
          target_value: number
          current_progress?: number
          reward_type: string
          reward_description: string
          reward_stats?: Record<string, number>
          reward_xp?: number
          completed?: boolean
          unlocked_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['boss_raids']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_key: string
          title: string
          description: string
          icon: string
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_key: string
          title: string
          description: string
          icon?: string
          rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          unlocked_at?: string
        }
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      voice_commands: {
        Row: {
          id: string
          user_id: string
          command_text: string
          command_type: string
          recognized_intent: string | null
          parameters: Record<string, any>
          executed_successfully: boolean
          response_text: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          command_text: string
          command_type: string
          recognized_intent?: string | null
          parameters?: Record<string, any>
          executed_successfully?: boolean
          response_text?: string | null
        }
        Update: Partial<Database['public']['Tables']['voice_commands']['Insert']>
      }
    }
    Functions: {
      generate_daily_missions: {
        Args: { user_uuid: string; mission_date?: string }
        Returns: void
      }
      create_initial_boss_raids: {
        Args: { user_uuid: string }
        Returns: void
      }
    }
  }
}