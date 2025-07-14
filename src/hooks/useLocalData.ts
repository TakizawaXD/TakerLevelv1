import { useLocalStorage } from './useLocalStorage'
import { useLocalAuth } from './useLocalAuth'
import { format } from 'date-fns'

export type DailyQuest = {
  id: string
  user_id: string
  date: string
  quest_type: string
  title: string
  description: string
  xp_reward: number
  completed: boolean
  created_at: string
}

export type Workout = {
  id: string
  user_id: string
  date: string
  type: string
  intensity: 'low' | 'medium' | 'high' | 'extreme'
  duration: number
  xp_gained: number
  notes: string
  created_at: string
}

export type BossFight = {
  id: string
  user_id: string
  title: string
  description: string
  target_value: number
  current_progress: number
  reward_type: string
  reward_description: string
  completed: boolean
  created_at: string
  completed_at: string | null
}

export function useLocalData() {
  const { user } = useLocalAuth()
  const [dailyQuests, setDailyQuests] = useLocalStorage<DailyQuest[]>('taker_daily_quests', [])
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('taker_workouts', [])
  const [bossRaids, setBossRaids] = useLocalStorage<BossFight[]>('taker_boss_fights', [])

  const getUserDailyQuests = (date: string) => {
    if (!user) return []
    return dailyQuests.filter(q => q.user_id === user.id && q.date === date)
  }

  const getUserWorkouts = (limit?: number) => {
    if (!user) return []
    const userWorkouts = workouts
      .filter(w => w.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    return limit ? userWorkouts.slice(0, limit) : userWorkouts
  }

  const getUserBossRaids = () => {
    if (!user) return []
    return bossRaids.filter(b => b.user_id === user.id && !b.completed)
  }

  const createDailyQuests = (date: string) => {
    if (!user) return

    const existingQuests = getUserDailyQuests(date)
    if (existingQuests.length > 0) return

    const defaultQuests = [
      { title: '💧 Beber 2L de agua', description: 'Mantén tu hidratación óptima', xp_reward: 5 },
      { title: '🏃 Entrenar 20+ minutos', description: 'Completa una sesión de entrenamiento', xp_reward: 15 },
      { title: '😴 Dormir 7+ horas', description: 'Descansa para recuperarte', xp_reward: 10 },
      { title: '🥗 Comer saludable', description: 'Al menos 3 comidas balanceadas', xp_reward: 8 },
    ]

    const newQuests: DailyQuest[] = defaultQuests.map(quest => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      date,
      quest_type: 'daily',
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xp_reward,
      completed: false,
      created_at: new Date().toISOString(),
    }))

    setDailyQuests([...dailyQuests, ...newQuests])
  }

  const completeQuest = (questId: string) => {
    const updatedQuests = dailyQuests.map(q =>
      q.id === questId ? { ...q, completed: true } : q
    )
    setDailyQuests(updatedQuests)
  }

  const addWorkout = (workout: Omit<Workout, 'id' | 'created_at'>) => {
    if (!user) return

    const newWorkout: Workout = {
      ...workout,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    }

    setWorkouts([...workouts, newWorkout])
    return newWorkout
  }

  const createInitialBossRaids = () => {
    if (!user) return

    const existingRaids = getUserBossRaids()
    if (existingRaids.length > 0) return

    const initialRaids: BossFight[] = [
      {
        id: Date.now().toString() + '1',
        user_id: user.id,
        title: '🔥 Racha de Fuego',
        description: 'Entrena 7 días consecutivos',
        target_value: 7,
        current_progress: 0,
        reward_type: 'stat_boost',
        reward_description: '+2 STR, +1 VIT',
        completed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
      },
      {
        id: Date.now().toString() + '2',
        user_id: user.id,
        title: '⚡ Velocista Sombra',
        description: 'Corre 5km sin parar',
        target_value: 1,
        current_progress: 0,
        reward_type: 'title',
        reward_description: 'Título: "Corredor Umbral" + 1 AGI',
        completed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
      },
      {
        id: Date.now().toString() + '3',
        user_id: user.id,
        title: '💪 Fuerza Absoluta',
        description: 'Completa 50 entrenamientos',
        target_value: 50,
        current_progress: 0,
        reward_type: 'major_boost',
        reward_description: '+3 STR, +2 VIT, Título: "Cazador de Élite"',
        completed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
      },
    ]

    setBossRaids([...bossRaids, ...initialRaids])
  }

  return {
    getUserDailyQuests,
    getUserWorkouts,
    getUserBossRaids,
    createDailyQuests,
    completeQuest,
    addWorkout,
    createInitialBossRaids,
  }
}