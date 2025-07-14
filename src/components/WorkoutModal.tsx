import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Dumbbell, Plus, Minus } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { useGameData } from '../hooks/useGameData'

interface WorkoutModalProps {
  onClose: () => void
}

interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
}

export function WorkoutModal({ onClose }: WorkoutModalProps) {
  const { addWorkout } = useGameData()
  const [type, setType] = useState('')
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high' | 'extreme'>('medium')
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)

  const calculateXP = (intensity: string, duration: number) => {
    const baseXP = {
      low: 1,
      medium: 2,
      high: 3,
      extreme: 4
    }[intensity] || 2

    return Math.floor(baseXP * (duration / 10))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type.trim()) return

    setLoading(true)

    const xpGained = calculateXP(intensity, duration)
    
    const result = await addWorkout({
      date: new Date().toISOString().split('T')[0],
      type: type.trim(),
      intensity,
      duration,
      xp_gained: xpGained,
      notes: notes.trim(),
      exercises: exercises,
    })

    if (result?.leveledUp) {
      // Show level up notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce'
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎉</span>
          <div>
            <div class="font-bold">¡LEVEL UP!</div>
            <div class="text-sm">Nivel ${result.newLevel} alcanzado</div>
          </div>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 4000)
    }

    setLoading(false)
    onClose()
  }

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10 }])
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = exercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    )
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const workoutTypes = [
    'Fullbody', 'Push', 'Pull', 'Legs', 'Cardio', 'HIIT', 
    'Yoga', 'Pilates', 'Calistenia', 'Pesas', 'Running', 'Ciclismo',
    'Natación', 'Boxeo', 'Crossfit', 'Funcional'
  ]

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <SystemWindow title="💪 NUEVO ENTRENAMIENTO">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Tipo de Entrenamiento
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  {workoutTypes.map(workoutType => (
                    <option key={workoutType} value={workoutType}>{workoutType}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Intensidad
                </label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as any)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="low">🟢 Baja</option>
                  <option value="medium">🟡 Media</option>
                  <option value="high">🟠 Alta</option>
                  <option value="extreme">🔴 Extrema</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Duración (minutos)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min="1"
                max="300"
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Exercises Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-slate-300 font-medium">
                  Ejercicios (opcional)
                </label>
                <GlowButton
                  type="button"
                  onClick={addExercise}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </GlowButton>
              </div>
              
              {exercises.map((exercise, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-3 mb-3 border border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre del ejercicio"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Series"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                      className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Repeticiones"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                      className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Peso (kg)"
                        value={exercise.weight || ''}
                        onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || undefined)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="¿Cómo te sentiste? ¿Algún logro especial?"
              />
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-center">
                <span className="text-blue-400 font-bold text-xl">
                  +{calculateXP(intensity, duration)} XP
                </span>
                <p className="text-slate-400 text-sm">XP que ganarás</p>
              </div>
            </div>

            <div className="flex gap-3">
              <GlowButton
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </GlowButton>
              <GlowButton
                type="submit"
                disabled={loading || !type.trim()}
                className="flex-1"
              >
                {loading ? 'Guardando...' : '💪 Completar Entrenamiento'}
              </GlowButton>
            </div>
          </form>
        </SystemWindow>
      </motion.div>
    </motion.div>
  )
}