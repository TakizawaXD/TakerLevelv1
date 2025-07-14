import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Dumbbell, Target, Trophy, Calendar, TrendingUp, User, Plus, 
  LogOut, Award, Zap, Crown, Flame, Mic, Droplets, Utensils
} from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { StatBar } from './ui/StatBar'
import { GlowButton } from './ui/GlowButton'
import { useUserProfile } from '../hooks/useUserProfile'
import { useAuth } from '../hooks/useAuth'
import { VoiceAssistant } from './VoiceAssistant'
import { DailyMissions } from './DailyMissions'
import { ExerciseCounter } from '../components/ExerciseCounter' 
import { NutritionTracker } from './NutritionTracker'
import { HydrationTracker } from './HydrationTracker'
import { SystemChatbot } from './SystemChatbot'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/supabase'

type BossRaid = Database['public']['Tables']['boss_raids']['Row']
type Achievement = Database['public']['Tables']['achievements']['Row']

export function Dashboard() {
  const { profile } = useUserProfile()
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [bossRaids, setBossRaids] = useState<BossRaid[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchGameData()
    }
  }, [profile])

  const fetchGameData = async () => {
    if (!profile) return

    try {
      // Crear boss raids iniciales si no existen
      await supabase.rpc('create_initial_boss_raids', { user_uuid: profile.id })

      // Obtener boss raids activos
      const { data: bossData } = await supabase
        .from('boss_raids')
        .select('*')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .order('difficulty', { ascending: true })

      // Obtener logros recientes
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', profile.id)
        .order('unlocked_at', { ascending: false })
        .limit(5)

      setBossRaids(bossData || [])
      setAchievements(achievementsData || [])
    } catch (error) {
      console.error('Error fetching game data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Inicializando SYSTEM REAPER...</div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'missions':
        return <DailyMissions />
      case 'counter':
        return <ExerciseCounter />
      case 'nutrition':
        return <NutritionTracker />
      case 'hydration':
        return <HydrationTracker />
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Player Stats */}
      <SystemWindow title="📊 ESTADO DEL CAZADOR">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{profile.username}</h3>
                <p className="text-slate-400">Nivel {profile.level} • {profile.title}</p>
                <p className="text-slate-500 text-sm">Rango {profile.rank}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 text-sm">{profile.current_streak} días</span>
                  <Crown className="w-4 h-4 text-yellow-400 ml-2" />
                  <span className="text-yellow-400 text-sm">{profile.max_streak} récord</span>
                </div>
              </div>
            </div>
            
            <StatBar 
              label="XP" 
              current={profile.current_xp} 
              max={profile.xp_to_next_level}
              color="blue"
            />

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-white font-bold">⚡ ESTADÍSTICAS</h4>
                {profile.available_points > 0 && (
                  <span className="text-yellow-400 font-bold text-sm">
                    +{profile.available_points} puntos
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{profile.str}</div>
                  <div className="text-xs text-slate-400">STR</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{profile.agi}</div>
                  <div className="text-xs text-slate-400">AGI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{profile.int}</div>
                  <div className="text-xs text-slate-400">INT</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{profile.vit}</div>
                  <div className="text-xs text-slate-400">VIT</div>
                </div>
                <div className="text-center col-span-2">
                  <div className="text-2xl font-bold text-purple-400">{profile.cha}</div>
                  <div className="text-xs text-slate-400">CHA</div>
                </div>
              </div>
            </div>
          </div>

          {/* Boss Raids Preview */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              BOSS RAIDS ACTIVOS
            </h4>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {bossRaids.slice(0, 3).map((boss) => (
                <div
                  key={boss.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-white font-bold text-sm">{boss.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${
                      boss.difficulty === 'S' ? 'bg-purple-600 text-white' :
                      boss.difficulty === 'A' ? 'bg-red-600 text-white' :
                      boss.difficulty === 'B' ? 'bg-orange-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {boss.difficulty}
                    </span>
                  </div>
                  <StatBar 
                    label="Progreso"
                    current={boss.current_progress}
                    max={boss.target_value}
                    color="purple"
                    showNumbers={false}
                  />
                  <div className="mt-2 text-xs text-yellow-400">
                    🏆 {boss.reward_description}
                  </div>
                </div>
              ))}
              
              {bossRaids.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay Boss Raids activos</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              LOGROS RECIENTES
            </h4>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h5 className="text-yellow-400 font-bold text-sm">{achievement.title}</h5>
                      <p className="text-slate-300 text-xs">{achievement.description}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        achievement.rarity === 'mythic' ? 'bg-pink-600 text-white' :
                        achievement.rarity === 'legendary' ? 'bg-purple-600 text-white' :
                        achievement.rarity === 'epic' ? 'bg-purple-500 text-white' :
                        achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {achievement.rarity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {achievements.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Completa misiones para desbloquear logros</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SystemWindow>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-blue-400">{profile.level}</div>
          <div className="text-slate-400 text-sm">Nivel</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-green-400">{profile.total_workouts}</div>
          <div className="text-slate-400 text-sm">Entrenamientos</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-purple-400">{profile.total_xp.toLocaleString()}</div>
          <div className="text-slate-400 text-sm">XP Total</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-orange-400">{profile.total_missions_completed}</div>
          <div className="text-slate-400 text-sm">Misiones</div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center p-6"
        >
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-red-600">
              SYSTEM REAPER
            </h1>
            <p className="text-slate-400 mt-2">Solo Leveling Fitness System v3.0</p>
          </div>
          <GlowButton 
            onClick={handleSignOut}
            variant="secondary"
            className="px-4 py-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </GlowButton>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="px-6 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: TrendingUp },
              { id: 'missions', label: '🔔 Misiones', icon: Calendar },
              { id: 'counter', label: '🏋️ Contador', icon: Dumbbell },
              { id: 'nutrition', label: '🍽️ Nutrición', icon: Utensils },
              { id: 'hydration', label: '💧 Hidratación', icon: Droplets }
            ].map((tab) => (
              <GlowButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? "primary" : "secondary"}
                className="px-4 py-2 text-sm"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </GlowButton>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          {renderTabContent()}
        </div>

        {/* Voice Assistant */}
        <VoiceAssistant />
      </div>
      <SystemChatbot />
    </>
  )
}