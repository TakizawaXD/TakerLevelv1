import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Utensils, Plus, Trash2 } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { supabase } from '../lib/supabase'
import { useUserProfile } from '../hooks/useUserProfile'
import { Database } from '../lib/supabase'

type NutritionLog = Database['public']['Tables']['nutrition_logs']['Row']

const healthyFoods = [
  { name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Proteína' },
  { name: 'Arroz Integral', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, category: 'Carbohidrato' },
  { name: 'Brócoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'Verdura' },
  { name: 'Salmón', calories: 208, protein: 22, carbs: 0, fat: 12, category: 'Proteína' },
  { name: 'Avena', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, category: 'Carbohidrato' },
  { name: 'Espinacas', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Verdura' },
  { name: 'Huevos', calories: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Proteína' },
  { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, category: 'Carbohidrato' },
  { name: 'Aguacate', calories: 160, protein: 2, carbs: 9, fat: 15, category: 'Grasa Saludable' },
  { name: 'Almendras', calories: 579, protein: 21, carbs: 22, fat: 50, category: 'Grasa Saludable' }
]

const unhealthyFoods = [
  { name: 'Pizza', calories: 266, protein: 11, carbs: 33, fat: 10, category: 'Comida Rápida' },
  { name: 'Hamburguesa', calories: 540, protein: 25, carbs: 40, fat: 31, category: 'Comida Rápida' },
  { name: 'Papas Fritas', calories: 365, protein: 4, carbs: 63, fat: 17, category: 'Comida Rápida' },
  { name: 'Refresco', calories: 139, protein: 0, carbs: 39, fat: 0, category: 'Bebida Azucarada' },
  { name: 'Donas', calories: 452, protein: 5, carbs: 51, fat: 25, category: 'Dulce' },
  { name: 'Helado', calories: 207, protein: 3.5, carbs: 24, fat: 11, category: 'Dulce' }
]

export function NutritionTracker() {
  const { profile } = useUserProfile()
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [selectedFood, setSelectedFood] = useState('')
  const [customFood, setCustomFood] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchNutritionLogs()
    }
  }, [profile])

  const fetchNutritionLogs = async () => {
    if (!profile) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNutritionLogs(data || [])
    } catch (error) {
      console.error('Error fetching nutrition logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addNutritionLog = async (foodData: any, isHealthy: boolean) => {
    if (!profile) return

    try {
      const xpBonus = isHealthy ? 2 : -1
      
      const { error } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: profile.id,
          meal_type: selectedMealType,
          food_name: foodData.name,
          quantity,
          calories: Math.round(foodData.calories * quantity),
          protein_g: Math.round(foodData.protein * quantity * 10) / 10,
          carbs_g: Math.round(foodData.carbs * quantity * 10) / 10,
          fat_g: Math.round(foodData.fat * quantity * 10) / 10,
          is_healthy: isHealthy,
          xp_bonus: xpBonus
        })

      if (error) throw error

      await fetchNutritionLogs()
      
      // Actualizar XP del usuario
      if (profile) {
        const newTotalXp = profile.total_xp + xpBonus
        let newCurrentXp = profile.current_xp + xpBonus
        let newLevel = profile.level
        let newAvailablePoints = profile.available_points
        let newXpToNext = profile.xp_to_next_level

        while (newCurrentXp >= newXpToNext && newCurrentXp > 0) {
          newCurrentXp -= newXpToNext
          newLevel++
          newAvailablePoints++
          newXpToNext = newLevel * 100
        }

        await supabase
          .from('user_profiles')
          .update({
            total_xp: newTotalXp,
            current_xp: Math.max(0, newCurrentXp),
            level: newLevel,
            available_points: newAvailablePoints,
            xp_to_next_level: newXpToNext
          })
          .eq('id', profile.id)
      }

      // Actualizar progreso de misión de nutrición
      await updateNutritionMission()

      // Mostrar notificación
      showNutritionNotification(foodData.name, isHealthy, xpBonus)

      setSelectedFood('')
      setCustomFood('')
      setQuantity(1)
      setShowCustomForm(false)

    } catch (error) {
      console.error('Error adding nutrition log:', error)
    }
  }

  const updateNutritionMission = async () => {
    if (!profile) return

    const today = new Date().toISOString().split('T')[0]
    const healthyMealsToday = nutritionLogs.filter(log => log.is_healthy).length + 1
    
    const { data: missions } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .eq('exercise_type', 'nutrition')
      .eq('completed', false)

    if (missions && missions.length > 0) {
      const mission = missions[0]
      const newProgress = Math.min(healthyMealsToday, mission.target_value)
      const completed = newProgress >= mission.target_value

      await supabase
        .from('daily_missions')
        .update({
          current_progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', mission.id)
    }
  }

  const showNutritionNotification = (foodName: string, isHealthy: boolean, xp: number) => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 ${isHealthy ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'} text-white p-4 rounded-lg shadow-lg z-50 animate-bounce`
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">${isHealthy ? '🥗' : '🍔'}</span>
        <div>
          <div class="font-bold">${isHealthy ? '¡COMIDA SALUDABLE!' : 'Comida Registrada'}</div>
          <div class="text-sm">${foodName} - ${xp > 0 ? '+' : ''}${xp} XP</div>
        </div>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  const deleteNutritionLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', logId)

      if (error) throw error
      await fetchNutritionLogs()
    } catch (error) {
      console.error('Error deleting nutrition log:', error)
    }
  }

  const handleQuickAdd = (food: any, isHealthy: boolean) => {
    addNutritionLog(food, isHealthy)
  }

  const handleCustomAdd = () => {
    if (!customFood.trim()) return

    const customFoodData = {
      name: customFood.trim(),
      calories: 200, // Estimación por defecto
      protein: 10,
      carbs: 20,
      fat: 5
    }

    addNutritionLog(customFoodData, true) // Asumimos que es saludable por defecto
  }

  const getTotalNutrition = () => {
    return nutritionLogs.reduce((total, log) => ({
      calories: total.calories + log.calories,
      protein: total.protein + log.protein_g,
      carbs: total.carbs + log.carbs_g,
      fat: total.fat + log.fat_g
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const totalNutrition = getTotalNutrition()
  const healthyMeals = nutritionLogs.filter(log => log.is_healthy).length

  if (loading) {
    return (
      <SystemWindow title="🍽️ NUTRICIÓN DE CAZADOR">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando registro nutricional...</p>
        </div>
      </SystemWindow>
    )
  }

  return (
    <SystemWindow title="🍽️ NUTRICIÓN DE CAZADOR">
      <div className="space-y-6">
        {/* Resumen nutricional del día */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xl font-bold text-orange-400">{totalNutrition.calories}</div>
            <div className="text-slate-400 text-sm">Calorías</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xl font-bold text-red-400">{Math.round(totalNutrition.protein)}g</div>
            <div className="text-slate-400 text-sm">Proteína</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xl font-bold text-blue-400">{Math.round(totalNutrition.carbs)}g</div>
            <div className="text-slate-400 text-sm">Carbos</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
            <div className="text-xl font-bold text-yellow-400">{Math.round(totalNutrition.fat)}g</div>
            <div className="text-slate-400 text-sm">Grasas</div>
          </div>
        </div>

        {/* Progreso de comidas saludables */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-300 font-bold">🥗 Comidas Saludables Hoy</span>
            <span className="text-green-400 font-bold">{healthyMeals}/5</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((healthyMeals / 5) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Selector de tipo de comida */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Tipo de comida
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'breakfast', label: '🌅 Desayuno', icon: '🥞' },
              { value: 'lunch', label: '☀️ Almuerzo', icon: '🍽️' },
              { value: 'dinner', label: '🌙 Cena', icon: '🍖' },
              { value: 'snack', label: '🍎 Snack', icon: '🥨' }
            ].map((meal) => (
              <button
                key={meal.value}
                onClick={() => setSelectedMealType(meal.value as any)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedMealType === meal.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-slate-600 bg-slate-800 hover:border-blue-400'
                }`}
              >
                <div className="text-2xl mb-1">{meal.icon}</div>
                <div className="text-white text-sm font-medium">{meal.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Cantidad (porciones)
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            min="0.1"
            step="0.1"
          />
        </div>

        {/* Comidas saludables */}
        <div>
          <h4 className="text-green-300 font-bold mb-3">🥗 Comidas Saludables (+2 XP)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {healthyFoods.map((food) => (
              <button
                key={food.name}
                onClick={() => handleQuickAdd(food, true)}
                className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg hover:bg-green-900/30 transition-colors text-left"
              >
                <div className="text-green-300 font-medium text-sm">{food.name}</div>
                <div className="text-green-200 text-xs">
                  {Math.round(food.calories * quantity)} cal | {food.category}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Comidas no saludables */}
        <div>
          <h4 className="text-red-300 font-bold mb-3">🍔 Comidas No Saludables (-1 XP)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {unhealthyFoods.map((food) => (
              <button
                key={food.name}
                onClick={() => handleQuickAdd(food, false)}
                className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg hover:bg-red-900/30 transition-colors text-left"
              >
                <div className="text-red-300 font-medium text-sm">{food.name}</div>
                <div className="text-red-200 text-xs">
                  {Math.round(food.calories * quantity)} cal | {food.category}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Comida personalizada */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-blue-300 font-bold">🍽️ Comida Personalizada</h4>
            <GlowButton
              onClick={() => setShowCustomForm(!showCustomForm)}
              variant="secondary"
              className="text-sm px-3 py-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              {showCustomForm ? 'Cancelar' : 'Agregar'}
            </GlowButton>
          </div>
          
          {showCustomForm && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFood}
                  onChange={(e) => setCustomFood(e.target.value)}
                  className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Nombre de la comida"
                />
                <GlowButton
                  onClick={handleCustomAdd}
                  disabled={!customFood.trim()}
                  className="px-6"
                >
                  Agregar
                </GlowButton>
              </div>
            </div>
          )}
        </div>

        {/* Historial del día */}
        <div>
          <h4 className="text-white font-bold mb-3">📋 Comidas de Hoy</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {nutritionLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                No has registrado comidas hoy
              </p>
            ) : (
              nutritionLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    log.is_healthy 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-red-900/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{log.is_healthy ? '🥗' : '🍔'}</span>
                    <div>
                      <div className="text-white font-medium">{log.food_name}</div>
                      <div className="text-slate-400 text-sm">
                        {log.meal_type} • {log.calories} cal • {log.quantity}x
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${log.is_healthy ? 'text-green-400' : 'text-red-400'}`}>
                      {log.xp_bonus > 0 ? '+' : ''}{log.xp_bonus} XP
                    </span>
                    <button
                      onClick={() => deleteNutritionLog(log.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Consejos nutricionales */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-300 font-bold mb-2">💡 Consejos Nutricionales</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Come 5-6 comidas pequeñas al día para mantener el metabolismo activo</li>
            <li>• Incluye proteína en cada comida para la recuperación muscular</li>
            <li>• Los carbohidratos complejos te darán energía sostenida</li>
            <li>• Las grasas saludables son esenciales para la producción hormonal</li>
            <li>• Evita los alimentos procesados y azúcares refinados</li>
          </ul>
        </div>
      </div>
    </SystemWindow>
  )
}