import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useUserProfile } from './useUserProfile'
import { Database } from '../lib/supabase'
import { format } from 'date-fns'

export type DailyQuest = Database['public']['Tables']['daily_quests']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type BossFight = Database['public']['Tables']['boss_fights']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']

export function useGameData() {
  const { user } = useAuth()
  const { profile, addXP } = useUserProfile()
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [bossRaids, setBossRaids] = useState<BossFight[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchAllData()
    }
  }, [profile])

  const fetchAllData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      // Generate daily quests for today if they don't exist
      await supabase.rpc('generate_daily_quests', { 
        user_uuid: profile.id,
        quest_date: format(new Date(), 'yyyy-MM-dd')
      })

      // Fetch daily quests
      const { data: questsData } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .order('created_at', { ascending: true })

      // Fetch recent workouts
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch active boss raids
      const { data: bossData } = await supabase
        .from('boss_fights')
        .select('*')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .order('difficulty', { ascending: true })

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', profile.id)
        .order('unlocked_at', { ascending: false })

      setDailyQuests(questsData || [])
      setWorkouts(workoutsData || [])
      setBossRaids(bossData || [])
      setAchievements(achievementsData || [])
    } catch (error) {
      console.error('Error fetching game data:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeQuest = async (questId: string) => {
    const quest = dailyQuests.find(q => q.id === questId)
    if (!quest || quest.completed) return

    const { error } = await supabase
      .from('daily_quests')
      .update({ 
        completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', questId)

    if (!error) {
      setDailyQuests(prev => 
        prev.map(q => 
          q.id === questId 
            ? { ...q, completed: true, completed_at: new Date().toISOString() }
            : q
        )
      )

      // Add XP and check for daily completion bonus
      const result = await addXP(quest.xp_reward, 'daily_quest')
      
      // Check if all daily quests are completed
      const allCompleted = dailyQuests.every(q => q.id === questId || q.completed)
      if (allCompleted) {
        await addXP(10, 'daily_bonus') // Bonus for completing all daily quests
      }

      return result
    }
  }

  const addWorkout = async (workoutData: Omit<Workout, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        ...workoutData,
        user_id: profile.id,
      })
      .select()
      .single()

    if (!error && data) {
      setWorkouts(prev => [data, ...prev.slice(0, 9)]) // Keep only 10 most recent
      
      // Update total workouts count
      await supabase
        .from('users')
        .update({ total_workouts: profile.total_workouts + 1 })
        .eq('id', profile.id)

      // Add XP
      const result = await addXP(workoutData.xp_gained, 'workout')
      
      // Update boss fight progress
      await updateBossProgress('workout', 1)
      
      // Check for workout achievements
      await checkWorkoutAchievements(profile.total_workouts + 1)

      return { workout: data, ...result }
    }
  }

  const updateBossProgress = async (type: string, increment: number = 1) => {
    if (!profile) return

    for (const boss of bossRaids) {
      let shouldUpdate = false
      let newProgress = boss.current_progress

      switch (boss.boss_type) {
        case 'workout_count':
          if (type === 'workout') {
            newProgress += increment
            shouldUpdate = true
          }
          break
        case 'level_target':
          newProgress = profile.level
          shouldUpdate = true
          break
        case 'daily_streak':
          // This would be updated when completing all daily quests
          break
      }

      if (shouldUpdate && newProgress !== boss.current_progress) {
        const completed = newProgress >= boss.target_value
        
        await supabase
          .from('boss_fights')
          .update({
            current_progress: newProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          })
          .eq('id', boss.id)

        if (completed) {
          // Award boss rewards
          await awardBossReward(boss)
        }
      }
    }

    // Refresh boss raids
    fetchAllData()
  }

  const awardBossReward = async (boss: BossFight) => {
    if (!profile) return

    // Add achievement
    await supabase.from('achievements').insert({
      user_id: profile.id,
      achievement_key: `boss_${boss.id}`,
      title: `🏆 ${boss.title}`,
      description: `Completaste: ${boss.description}`,
      icon: '🏆',
      rarity: boss.difficulty === 'legendary' ? 'legendary' : 
             boss.difficulty === 'extreme' ? 'epic' : 'rare'
    })

    // Apply stat rewards
    if (boss.reward_stats && Object.keys(boss.reward_stats).length > 0) {
      const statUpdates: any = {}
      
      for (const [stat, value] of Object.entries(boss.reward_stats)) {
        if (['str', 'agi', 'int', 'vit', 'cha'].includes(stat)) {
          statUpdates[stat] = profile[stat as keyof UserProfile] + value
          
          // Record stat history
          await supabase.from('stat_history').insert({
            user_id: profile.id,
            stat_type: stat,
            old_value: profile[stat as keyof UserProfile] as number,
            new_value: statUpdates[stat],
            reason: `boss_reward_${boss.id}`
          })
        }
      }

      if (Object.keys(statUpdates).length > 0) {
        await supabase
          .from('users')
          .update(statUpdates)
          .eq('id', profile.id)
      }
    }
  }

  const checkWorkoutAchievements = async (totalWorkouts: number) => {
    if (!profile) return

    const workoutAchievements = [
      { count: 1, key: 'first_workout', title: '🏃 Primer Paso', description: 'Completaste tu primer entrenamiento' },
      { count: 10, key: 'workout_10', title: '💪 Dedicación', description: 'Completaste 10 entrenamientos' },
      { count: 25, key: 'workout_25', title: '🔥 Constancia', description: 'Completaste 25 entrenamientos' },
      { count: 50, key: 'workout_50', title: '⚡ Guerrero', description: 'Completaste 50 entrenamientos' },
      { count: 100, key: 'workout_100', title: '👑 Maestro del Fitness', description: 'Completaste 100 entrenamientos' },
    ]

    for (const achievement of workoutAchievements) {
      if (totalWorkouts === achievement.count) {
        await supabase.from('achievements').insert({
          user_id: profile.id,
          achievement_key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.title.split(' ')[0],
          rarity: achievement.count >= 100 ? 'legendary' : 
                 achievement.count >= 50 ? 'epic' : 
                 achievement.count >= 25 ? 'rare' : 'common'
        }).on('conflict', () => {}) // Ignore if already exists
      }
    }
  }

  return {
    dailyQuests,
    workouts,
    bossRaids,
    achievements,
    loading,
    completeQuest,
    addWorkout,
    updateBossProgress,
    refreshData: fetchAllData,
  }
}