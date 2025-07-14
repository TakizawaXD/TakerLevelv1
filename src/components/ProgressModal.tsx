import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, TrendingUp, Calendar, Award, Target } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { StatBar } from './ui/StatBar'
import { useUserProfile } from '../hooks/useUserProfile'
import { useGameData } from '../hooks/useGameData'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ProgressModalProps {
  onClose: () => void
}

interface WeeklyData {
  week: string
  workouts: number
  xp: number
}

interface StatProgress {
  date: string
  str: number
  agi: number
  int: number
  vit: number
  cha: number
}

export function ProgressModal({ onClose }: ProgressModalProps) {
  const { profile } = useUserProfile()
  const { workouts, achievements } = useGameData()
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [statHistory, setStatHistory] = useState<StatProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchProgressData()
    }
  }, [profile])

  const fetchProgressData = async () => {
    if (!profile) return

    try {
      // Get last 8 weeks of workout data
      const weeks = []
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(new Date(), i * 7))
        const weekEnd = endOfWeek(weekStart)
        
        const weekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.date)
          return workoutDate >= weekStart && workoutDate <= weekEnd
        })

        weeks.push({
          week: format(weekStart, 'dd/MM'),
          workouts: weekWorkouts.length,
          xp: weekWorkouts.reduce((sum, w) => sum + w.xp_gained, 0)
        })
      }
      setWeeklyData(weeks)

      // Get stat history
      const { data: statData } = await supabase
        .from('stat_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })

      if (statData) {
        // Group by date and get latest stats for each day
        const statsByDate: Record<string, StatProgress> = {}
        
        statData.forEach(record => {
          const date = format(new Date(record.created_at), 'yyyy-MM-dd')
          if (!statsByDate[date]) {
            statsByDate[date] = {
              date,
              str: profile.str,
              agi: profile.agi,
              int: profile.int,
              vit: profile.vit,
              cha: profile.cha
            }
          }
          statsByDate[date][record.stat_type as keyof StatProgress] = record.new_value
        })

        setStatHistory(Object.values(statsByDate).slice(-30)) // Last 30 days
      }

    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return null

  const totalWorkouts = workouts.length
  const totalXP = profile.total_xp
  const currentLevel = profile.level
  const currentStreak = profile.current_streak
  const maxStreak = profile.max_streak

  const recentAchievements = achievements.slice(0, 6)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <SystemWindow title="📊 PROGRESO DEL CAZADOR">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Cargando datos de progreso...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-blue-400">{currentLevel}</div>
                  <div className="text-slate-400 text-sm">Nivel Actual</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-green-400">{totalWorkouts}</div>
                  <div className="text-slate-400 text-sm">Entrenamientos</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-purple-400">{totalXP.toLocaleString()}</div>
                  <div className="text-slate-400 text-sm">XP Total</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-orange-400">{currentStreak}</div>
                  <div className="text-slate-400 text-sm">Racha Actual</div>
                </div>
              </div>

              {/* Weekly Activity Chart */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Actividad Semanal
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="workouts" fill="#3B82F6" name="Entrenamientos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* XP Progress Chart */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Progreso de XP
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="xp" 
                        stroke="#8B5CF6" 
                        strokeWidth={3}
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                        name="XP Ganado"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Current Stats */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-4">⚡ Estadísticas Actuales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <StatBar label="STR (Fuerza)" current={profile.str} max={50} color="red" />
                    <StatBar label="AGI (Agilidad)" current={profile.agi} max={50} color="green" />
                    <StatBar label="INT (Inteligencia)" current={profile.int} max={50} color="blue" />
                  </div>
                  <div className="space-y-3">
                    <StatBar label="VIT (Vitalidad)" current={profile.vit} max={50} color="orange" />
                    <StatBar label="CHA (Carisma)" current={profile.cha} max={50} color="purple" />
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">Racha Máxima: {maxStreak} días</div>
                        <div className="text-slate-400 text-sm">Tu mejor racha de entrenamientos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Achievements */}
              {recentAchievements.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Logros Recientes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg"
                      >
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <h5 className="text-yellow-400 font-bold text-sm">{achievement.title}</h5>
                          <p className="text-slate-300 text-xs">{achievement.description}</p>
                          <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                            achievement.rarity === 'legendary' ? 'bg-purple-600 text-white' :
                            achievement.rarity === 'epic' ? 'bg-purple-500 text-white' :
                            achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {achievement.rarity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <GlowButton
                  onClick={onClose}
                  variant="secondary"
                  className="px-8"
                >
                  Cerrar
                </GlowButton>
              </div>
            </div>
          )}
        </SystemWindow>
      </motion.div>
    </motion.div>
  )
}