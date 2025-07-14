import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Clock, Zap, AlertTriangle, CheckCircle, Plus } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { StatBar } from './ui/StatBar'
import { GlowButton } from './ui/GlowButton'
import { supabase } from '../lib/supabase'
import { useUserProfile } from '../hooks/useUserProfile'
import { Database } from '../lib/supabase'
import { toast } from 'react-hot-toast' // Assuming you have a toast notification library

// Define the type for DailyMission from your Supabase database
type DailyMission = Database['public']['Tables']['daily_missions']['Row']

/**
 * Renders the daily missions interface for the user.
 * It fetches, displays, and allows users to update progress on their daily missions,
 * distinguishing between required and bonus missions.
 */
export function DailyMissions() {
  const { profile, refetchProfile } = useUserProfile() // Assuming useUserProfile provides refetchProfile
  const [missions, setMissions] = useState<DailyMission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMission, setSelectedMission] = useState<DailyMission | null>(null)
  const [progressInput, setProgressInput] = useState('')

  // Fetch daily missions when the profile is available or changes
  const fetchDailyMissions = useCallback(async () => {
    if (!profile) return

    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Generate missions if they don't exist for today
      // Consider adding a check in the RPC to avoid unnecessary generation calls
      const { error: generateError } = await supabase.rpc('generate_daily_missions', {
        user_uuid: profile.id,
        mission_date: today,
      })

      if (generateError) throw generateError

      // Retrieve today's missions
      const { data, error: fetchError } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .order('mission_type', { ascending: true })

      if (fetchError) throw fetchError
      setMissions(data || [])
    } catch (error) {
      console.error('Error fetching or generating daily missions:', error)
      toast.error('Failed to load missions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  useEffect(() => {
    fetchDailyMissions()
  }, [fetchDailyMissions])

  // Update mission progress and user XP
  const updateMissionProgress = useCallback(
    async (missionId: string, additionalProgress: number) => {
      const missionToUpdate = missions.find((m) => m.id === missionId)
      if (!missionToUpdate || !profile) return

      const newProgress = Math.min(
        missionToUpdate.current_progress + additionalProgress,
        missionToUpdate.target_value
      )
      const completed = newProgress >= missionToUpdate.target_value

      try {
        const { error } = await supabase
          .from('daily_missions')
          .update({
            current_progress: newProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq('id', missionId)

        if (error) throw error

        // Optimistically update local state
        setMissions((prev) =>
          prev.map((m) =>
            m.id === missionId
              ? {
                  ...m,
                  current_progress: newProgress,
                  completed,
                  completed_at: completed ? new Date().toISOString() : null,
                }
              : m
          )
        )

        if (completed) {
          // If mission completed, update user profile (XP, level, etc.)
          await refetchProfile() // Refetch profile to get the most updated XP/level
          toast.success(`${missionToUpdate.title} completed! +${missionToUpdate.xp_reward} XP!`)
        } else {
          toast.success(`Progress updated for ${missionToUpdate.title}!`)
        }

        setSelectedMission(null)
        setProgressInput('')
      } catch (error) {
        console.error('Error updating mission progress or user profile:', error)
        toast.error('Failed to update mission. Please try again.')
        // Revert local state if update fails (optional, but good for UX)
        setMissions((prev) =>
          prev.map((m) => (m.id === missionId ? missionToUpdate : m))
        )
      }
    },
    [missions, profile, refetchProfile]
  )

  // Memoized mission categorization and counts for efficiency
  const { requiredMissions, bonusMissions, completedRequired, allRequiredCompleted } = useMemo(() => {
    const req = missions.filter((m) => m.mission_type === 'daily_required')
    const bonus = missions.filter((m) => m.mission_type !== 'daily_required')
    const completedReqCount = req.filter((m) => m.completed).length
    const allReqComp = completedReqCount === req.length && req.length > 0

    return {
      requiredMissions: req,
      bonusMissions: bonus,
      completedRequired: completedReqCount,
      allRequiredCompleted: allReqComp,
    }
  }, [missions])

  // Helper function to get mission icon
  const getMissionIcon = useCallback((exerciseType: string | null) => {
    switch (exerciseType) {
      case 'pushups':
        return '💪'
      case 'situps':
        return '🔥'
      case 'squats':
        return '🦵'
      case 'running':
        return '🏃'
      case 'water':
        return '💧'
      case 'nutrition':
        return '🥗'
      case 'workout':
        return '⚡'
      default:
        return '🎯'
    }
  }, [])

  // Helper function to get mission card border and background color
  const getMissionTypeColor = useCallback((missionType: string) => {
    switch (missionType) {
      case 'daily_required':
        return 'border-red-500/50 bg-red-900/20'
      case 'bonus':
        return 'border-blue-500/50 bg-blue-900/20'
      case 'special':
        return 'border-purple-500/50 bg-purple-900/20'
      default:
        return 'border-slate-500/50 bg-slate-900/20'
    }
  }, [])

  if (isLoading) {
    return (
      <SystemWindow title="🔔 MISIONES DIARIAS">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando misiones del sistema...</p>
        </div>
      </SystemWindow>
    )
  }

  return (
    <SystemWindow title="🔔 MISIONES DIARIAS - SYSTEM REAPER">
      <div className="space-y-6">
        {/* Header de advertencia estilo Solo Leveling */}
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-red-300 font-bold text-lg">⚠️ MISIONES OBLIGATORIAS</h3>
          </div>
          <p className="text-red-200 text-sm mb-2">
            Completa todas las misiones obligatorias antes del final del día o recibirás penalizaciones.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300">
                {completedRequired}/{requiredMissions.length} Completadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              {/* This time display only shows current time, not time remaining for the day. */}
              {/* For accurate time remaining, you'd need to calculate it based on midnight. */}
              <span className="text-orange-300">Tiempo actual: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Progreso general de misiones obligatorias */}
        {requiredMissions.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <StatBar
              label="Progreso de Misiones Obligatorias"
              current={completedRequired}
              max={requiredMissions.length}
              color={allRequiredCompleted ? 'green' : 'red'}
            />
            {allRequiredCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <span className="text-green-400 font-bold text-lg">
                  🎉 ¡TODAS LAS MISIONES OBLIGATORIAS COMPLETADAS! 🎉
                </span>
              </motion.div>
            )}
          </div>
        )}

        {/* Misiones Obligatorias List */}
        {requiredMissions.length > 0 && (
          <div>
            <h4 className="text-red-300 font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              MISIONES OBLIGATORIAS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {requiredMissions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }} // Animation for when mission is completed and removed/filtered
                    layout // Enable smooth layout transitions
                    className={`rounded-lg p-4 border-2 ${getMissionTypeColor(mission.mission_type)} ${
                      mission.completed ? 'opacity-75 grayscale' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMissionIcon(mission.exercise_type)}</span>
                        <div>
                          <h5 className="text-white font-bold">{mission.title}</h5>
                          <p className="text-slate-300 text-sm">{mission.description}</p>
                        </div>
                      </div>
                      {mission.completed && <CheckCircle className="w-6 h-6 text-green-400" />}
                    </div>

                    <StatBar
                      label="Progreso"
                      current={mission.current_progress}
                      max={mission.target_value}
                      color={mission.completed ? 'green' : 'red'}
                    />

                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm">
                        <span className="text-green-400 font-bold">+{mission.xp_reward} XP</span>
                        {mission.penalty_xp < 0 && (
                          <span className="text-red-400 ml-2">({mission.penalty_xp} XP si fallas)</span>
                        )}
                      </div>
                      {!mission.completed && (
                        <GlowButton
                          onClick={() => setSelectedMission(mission)}
                          variant="primary"
                          className="text-xs px-3 py-1"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar
                        </GlowButton>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Misiones Bonus List */}
        {bonusMissions.length > 0 && (
          <div>
            <h4 className="text-blue-300 font-bold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              MISIONES BONUS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {bonusMissions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                    className={`rounded-lg p-4 border ${getMissionTypeColor(mission.mission_type)} ${
                      mission.completed ? 'opacity-75 grayscale' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMissionIcon(mission.exercise_type)}</span>
                        <div>
                          <h5 className="text-white font-bold">{mission.title}</h5>
                          <p className="text-slate-300 text-sm">{mission.description}</p>
                        </div>
                      </div>
                      {mission.completed && <CheckCircle className="w-6 h-6 text-green-400" />}
                    </div>

                    <StatBar
                      label="Progreso"
                      current={mission.current_progress}
                      max={mission.target_value}
                      color={mission.completed ? 'green' : 'blue'}
                    />

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-blue-400 font-bold text-sm">+{mission.xp_reward} XP</span>
                      {!mission.completed && (
                        <GlowButton
                          onClick={() => setSelectedMission(mission)}
                          variant="secondary"
                          className="text-xs px-3 py-1"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar
                        </GlowButton>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Modal para agregar progreso */}
        <AnimatePresence>
          {selectedMission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-blue-500/30 rounded-lg p-6 max-w-md w-full"
              >
                <h3 className="text-white font-bold text-lg mb-4">
                  {getMissionIcon(selectedMission.exercise_type)} {selectedMission.title}
                </h3>
                <p className="text-slate-300 text-sm mb-4">{selectedMission.description}</p>

                <div className="mb-4">
                  <label htmlFor="progress-input" className="block text-slate-300 font-medium mb-2">
                    Agregar progreso ({selectedMission.unit})
                  </label>
                  <input
                    id="progress-input"
                    type="number"
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder={`Ej: ${
                      selectedMission.unit === 'reps' ? '10' : selectedMission.unit === 'km' ? '1.5' : '500'
                    }`}
                    min="0"
                    step={selectedMission.unit === 'km' ? '0.1' : '1'}
                    autoFocus // Automatically focus the input when modal opens
                  />
                </div>

                <div className="flex gap-3">
                  <GlowButton
                    onClick={() => {
                      setSelectedMission(null)
                      setProgressInput('')
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar
                  </GlowButton>
                  <GlowButton
                    onClick={() => {
                      const progress = parseFloat(progressInput)
                      if (!isNaN(progress) && progress > 0) {
                        updateMissionProgress(selectedMission.id, progress)
                      } else {
                        toast.error('Please enter a valid positive number for progress.')
                      }
                    }}
                    disabled={!progressInput || parseFloat(progressInput) <= 0 || isNaN(parseFloat(progressInput))}
                    className="flex-1"
                  >
                    Agregar
                  </GlowButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SystemWindow>
  )
}