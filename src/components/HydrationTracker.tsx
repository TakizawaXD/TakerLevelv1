import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { StatBar } from './ui/StatBar'
import { GlowButton } from './ui/GlowButton'
import { supabase } from '../lib/supabase'
import { useUserProfile } from '../hooks/useUserProfile'
import { Database } from '../lib/supabase'

type HydrationLog = Database['public']['Tables']['hydration_logs']['Row']

const quickAmounts = [250, 500, 750, 1000]
const drinkTypes = [
  { name: 'Agua', value: 'water', icon: '💧', multiplier: 1 },
  { name: 'Té', value: 'tea', icon: '🍵', multiplier: 0.8 },
  { name: 'Café', value: 'coffee', icon: '☕', multiplier: 0.6 },
  { name: 'Bebida Deportiva', value: 'sports_drink', icon: '🥤', multiplier: 0.7 }
]

export function HydrationTracker() {
  const { profile } = useUserProfile()
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([])
  const [customAmount, setCustomAmount] = useState('')
  const [selectedDrinkType, setSelectedDrinkType] = useState('water')
  const [loading, setLoading] = useState(true)

  const dailyGoal = 2500 // 2.5L objetivo diario

  useEffect(() => {
    if (profile) {
      fetchHydrationLogs()
    }
  }, [profile])

  const fetchHydrationLogs = async () => {
    if (!profile) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .order('time_consumed', { ascending: false })

      if (error) throw error
      setHydrationLogs(data || [])
    } catch (error) {
      console.error('Error fetching hydration logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addHydration = async (amount: number) => {
    if (!profile || amount <= 0) return

    try {
      const drinkType = drinkTypes.find(d => d.value === selectedDrinkType)
      const effectiveAmount = Math.round(amount * (drinkType?.multiplier || 1))

      const { error } = await supabase
        .from('hydration_logs')
        .insert({
          user_id: profile.id,
          amount_ml: amount,
          drink_type: selectedDrinkType
        })

      if (error) throw error

      await fetchHydrationLogs()
      setCustomAmount('')

      // Actualizar progreso de misión de hidratación
      await updateHydrationMission(effectiveAmount)

      // Mostrar notificación
      showHydrationNotification(amount, drinkType?.icon || '💧')

    } catch (error) {
      console.error('Error adding hydration:', error)
    }
  }

  const updateHydrationMission = async (amount: number) => {
    if (!profile) return

    const today = new Date().toISOString().split('T')[0]
    
    const { data: missions } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .eq('exercise_type', 'water')
      .eq('completed', false)

    if (missions && missions.length > 0) {
      const mission = missions[0]
      const newProgress = Math.min(mission.current_progress + amount, mission.target_value)
      const completed = newProgress >= mission.target_value

      await supabase
        .from('daily_missions')
        .update({
          current_progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', mission.id)

      if (completed) {
        // Agregar XP por completar misión
        const newTotalXp = profile.total_xp + mission.xp_reward
        let newCurrentXp = profile.current_xp + mission.xp_reward
        let newLevel = profile.level
        let newAvailablePoints = profile.available_points
        let newXpToNext = profile.xp_to_next_level

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
            total_missions_completed: profile.total_missions_completed + 1
          })
          .eq('id', profile.id)
      }
    }
  }

  const showHydrationNotification = (amount: number, icon: string) => {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce'
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">${icon}</span>
        <div>
          <div class="font-bold">¡HIDRATACIÓN REGISTRADA!</div>
          <div class="text-sm">+${amount}ml - ¡Mantén el ritmo!</div>
        </div>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  const totalHydration = hydrationLogs.reduce((sum, log) => {
    const drinkType = drinkTypes.find(d => d.value === log.drink_type)
    return sum + (log.amount_ml * (drinkType?.multiplier || 1))
  }, 0)

  const hydrationPercentage = Math.min((totalHydration / dailyGoal) * 100, 100)

  if (loading) {
    return (
      <SystemWindow title="💧 HIDRATACIÓN DE CAZADOR">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando registro de hidratación...</p>
        </div>
      </SystemWindow>
    )
  }

  return (
    <SystemWindow title="💧 HIDRATACIÓN DE CAZADOR">
      <div className="space-y-6">
        {/* Progreso diario */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative w-32 h-32 mx-auto mb-4"
          >
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - hydrationPercentage / 100)}`}
                className="text-blue-400 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(hydrationPercentage)}%
                </div>
                <div className="text-xs text-slate-400">
                  {Math.round(totalHydration)}ml
                </div>
              </div>
            </div>
          </motion.div>
          
          <StatBar
            label={`Objetivo Diario (${dailyGoal}ml)`}
            current={totalHydration}
            max={dailyGoal}
            color="blue"
          />
        </div>

        {/* Selector de tipo de bebida */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Tipo de bebida
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {drinkTypes.map((drink) => (
              <button
                key={drink.value}
                onClick={() => setSelectedDrinkType(drink.value)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedDrinkType === drink.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-slate-600 bg-slate-800 hover:border-blue-400'
                }`}
              >
                <div className="text-2xl mb-1">{drink.icon}</div>
                <div className="text-white text-sm font-medium">{drink.name}</div>
                <div className="text-slate-400 text-xs">x{drink.multiplier}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cantidades rápidas */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Cantidades rápidas
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <GlowButton
                key={amount}
                onClick={() => addHydration(amount)}
                variant="primary"
                className="py-3"
              >
                <Droplets className="w-4 h-4 mr-1" />
                {amount}ml
              </GlowButton>
            ))}
          </div>
        </div>

        {/* Cantidad personalizada */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Cantidad personalizada
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Cantidad en ml"
              min="1"
              max="2000"
            />
            <GlowButton
              onClick={() => {
                const amount = parseInt(customAmount)
                if (amount > 0) {
                  addHydration(amount)
                }
              }}
              disabled={!customAmount || parseInt(customAmount) <= 0}
              className="px-6"
            >
              <Plus className="w-5 h-5" />
            </GlowButton>
          </div>
        </div>

        {/* Historial del día */}
        <div>
          <h4 className="text-white font-bold mb-3">📋 Historial de Hoy</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {hydrationLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                No has registrado hidratación hoy
              </p>
            ) : (
              hydrationLogs.map((log) => {
                const drinkType = drinkTypes.find(d => d.value === log.drink_type)
                return (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{drinkType?.icon || '💧'}</span>
                      <div>
                        <div className="text-white font-medium">{drinkType?.name || 'Agua'}</div>
                        <div className="text-slate-400 text-sm">
                          {new Date(log.time_consumed).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-blue-400 font-bold">
                      {log.amount_ml}ml
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Consejos de hidratación */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-300 font-bold mb-2">💡 Consejos de Hidratación</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Bebe agua al despertar para activar tu metabolismo</li>
            <li>• Mantén una botella de agua siempre cerca</li>
            <li>• Bebe antes, durante y después del entrenamiento</li>
            <li>• El agua es la mejor opción para hidratarte</li>
            <li>• Si tu orina es amarilla oscura, necesitas más agua</li>
          </ul>
        </div>
      </div>
    </SystemWindow>
  )
}