import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { supabase } from '../lib/supabase'
import { useUserProfile } from '../hooks/useUserProfile'

interface Exercise {
  id: string
  name: string
  category: string
  xp_multiplier: number
}

export function ExerciseCounter() {
  const { profile } = useUserProfile()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [count, setCount] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [sets, setSets] = useState(1)
  const [currentSet, setCurrentSet] = useState(1)
  const [restTime, setRestTime] = useState(60)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isResting, setIsResting] = useState(false)

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isResting && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsResting(false)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isResting, timeLeft])

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, xp_multiplier')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setExercises(data || [])
      if (data && data.length > 0) {
        setSelectedExercise(data[0])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const incrementCount = () => {
    setCount(prev => prev + 1)
  }

  const decrementCount = () => {
    setCount(prev => Math.max(0, prev - 1))
  }

  const resetCount = () => {
    setCount(0)
    setCurrentSet(1)
    setIsActive(false)
    setIsResting(false)
    setTimeLeft(0)
  }

  const completeSet = async () => {
    if (!selectedExercise || !profile) return

    if (currentSet < sets) {
      // Iniciar descanso
      setIsResting(true)
      setTimeLeft(restTime)
      setCurrentSet(prev => prev + 1)
      setCount(0)
    } else {
      // Completar ejercicio
      await saveWorkout()
      resetCount()
    }
  }

  const saveWorkout = async () => {
    if (!selectedExercise || !profile || count === 0) return

    try {
      const xpGained = Math.floor(count * selectedExercise.xp_multiplier)
      
      // Crear workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: profile.id,
          name: `${selectedExercise.name} - ${sets} series`,
          type: selectedExercise.category,
          intensity: 'medium',
          duration_minutes: Math.ceil(sets * 2), // Estimación
          xp_gained: xpGained,
          notes: `${count} repeticiones por serie`
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Agregar ejercicio al workout
      await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workout.id,
          exercise_id: selectedExercise.id,
          sets: sets,
          reps: count
        })

      // Actualizar XP del usuario
      const newTotalXp = profile.total_xp + xpGained
      let newCurrentXp = profile.current_xp + xpGained
      let newLevel = profile.level
      let newAvailablePoints = profile.available_points
      let newXpToNext = profile.xp_to_next_level

      // Level up logic
      while (newCurrentXp >= newXpToNext) {
        newCurrentXp -= newXpToNext
        newLevel++
        newAvailablePoints++
        newXpToNext = newLevel * 100
      }

      await supabase
        .from('user_profiles')
        .update({
          total_xp: newTotalXp,
          current_xp: newCurrentXp,
          level: newLevel,
          available_points: newAvailablePoints,
          xp_to_next_level: newXpToNext,
          total_workouts: profile.total_workouts + 1
        })
        .eq('id', profile.id)

      // Mostrar notificación
      showCompletionNotification(xpGained)

    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  const showCompletionNotification = (xp: number) => {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce'
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">💪</span>
        <div>
          <div class="font-bold">¡EJERCICIO COMPLETADO!</div>
          <div class="text-sm">${selectedExercise?.name} - +${xp} XP</div>
        </div>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 4000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <SystemWindow title="🏋️ CONTADOR DE EJERCICIOS">
      <div className="space-y-6">
        {/* Selector de ejercicio */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Ejercicio
          </label>
          <select
            value={selectedExercise?.id || ''}
            onChange={(e) => {
              const exercise = exercises.find(ex => ex.id === e.target.value)
              setSelectedExercise(exercise || null)
              resetCount()
            }}
            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {exercises.map(exercise => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.category})
              </option>
            ))}
          </select>
        </div>

        {/* Configuración de series */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Series
            </label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="10"
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Descanso (seg)
            </label>
            <input
              type="number"
              value={restTime}
              onChange={(e) => setRestTime(Math.max(10, parseInt(e.target.value) || 60))}
              min="10"
              max="300"
              step="10"
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Estado actual */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-slate-400 text-sm mb-1">
            Serie {currentSet} de {sets}
          </div>
          <div className="text-6xl font-bold text-white mb-2">
            {count}
          </div>
          <div className="text-slate-400 text-sm">
            {selectedExercise?.name || 'Selecciona un ejercicio'}
          </div>
          {selectedExercise && (
            <div className="text-blue-400 text-sm mt-2">
              XP por rep: {selectedExercise.xp_multiplier}x
            </div>
          )}
        </div>

        {/* Temporizador de descanso */}
        {isResting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4 text-center"
          >
            <div className="text-orange-300 font-bold text-lg mb-2">
              ⏱️ DESCANSO
            </div>
            <div className="text-4xl font-bold text-orange-400 mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-orange-200 text-sm">
              Prepárate para la serie {currentSet}
            </div>
          </motion.div>
        )}

        {/* Controles */}
        <div className="grid grid-cols-3 gap-3">
          <GlowButton
            onClick={decrementCount}
            variant="secondary"
            className="py-4"
            disabled={count === 0 || isResting}
          >
            <Minus className="w-6 h-6" />
          </GlowButton>
          
          <GlowButton
            onClick={incrementCount}
            variant="primary"
            className="py-4 text-2xl"
            disabled={isResting}
          >
            <Plus className="w-8 h-8" />
          </GlowButton>
          
          <GlowButton
            onClick={resetCount}
            variant="danger"
            className="py-4"
          >
            <RotateCcw className="w-6 h-6" />
          </GlowButton>
        </div>

        {/* Botón de completar serie */}
        {count > 0 && !isResting && (
          <GlowButton
            onClick={completeSet}
            variant="success"
            className="w-full py-4 text-lg"
          >
            {currentSet < sets ? `Completar Serie ${currentSet}` : 'Finalizar Ejercicio'}
          </GlowButton>
        )}

        {/* Información de XP */}
        {selectedExercise && count > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="text-blue-300 text-sm">XP que ganarás:</div>
            <div className="text-blue-400 font-bold text-xl">
              +{Math.floor(count * sets * selectedExercise.xp_multiplier)} XP
            </div>
          </div>
        )}
      </div>
    </SystemWindow>
  )
}