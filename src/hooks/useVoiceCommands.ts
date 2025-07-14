import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useUserProfile } from './useUserProfile'

interface VoiceCommand {
  command: string
  intent: string
  parameters: Record<string, any>
  response: string
}

export function useVoiceCommands() {
  const { profile } = useUserProfile()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'es-ES'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase()
        setTranscript(transcript)
        processVoiceCommand(transcript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const processVoiceCommand = async (transcript: string) => {
    if (!profile) return

    let intent = 'unknown'
    let parameters: Record<string, any> = {}
    let response = 'Comando no reconocido'

    // Procesar diferentes tipos de comandos
    if (transcript.includes('flexion') || transcript.includes('push up')) {
      const match = transcript.match(/(\d+)/)
      if (match) {
        intent = 'exercise_count'
        parameters = { exercise: 'pushups', count: parseInt(match[1]) }
        response = `Registradas ${match[1]} flexiones. ¡Excelente trabajo, cazador!`
        await updateMissionProgress('pushups', parseInt(match[1]))
      }
    } else if (transcript.includes('abdominal') || transcript.includes('sit up')) {
      const match = transcript.match(/(\d+)/)
      if (match) {
        intent = 'exercise_count'
        parameters = { exercise: 'situps', count: parseInt(match[1]) }
        response = `Registrados ${match[1]} abdominales. ¡Sigue así!`
        await updateMissionProgress('situps', parseInt(match[1]))
      }
    } else if (transcript.includes('sentadilla') || transcript.includes('squat')) {
      const match = transcript.match(/(\d+)/)
      if (match) {
        intent = 'exercise_count'
        parameters = { exercise: 'squats', count: parseInt(match[1]) }
        response = `Registradas ${match[1]} sentadillas. ¡Fortaleciendo las piernas!`
        await updateMissionProgress('squats', parseInt(match[1]))
      }
    } else if (transcript.includes('corr') || transcript.includes('kilómetro')) {
      const match = transcript.match(/(\d+(?:\.\d+)?)/)
      if (match) {
        intent = 'exercise_count'
        parameters = { exercise: 'running', distance: parseFloat(match[1]) }
        response = `Registrados ${match[1]} km de carrera. ¡Velocidad de cazador!`
        await updateMissionProgress('running', parseFloat(match[1]))
      }
    } else if (transcript.includes('agua') || transcript.includes('beb')) {
      const match = transcript.match(/(\d+)/)
      if (match) {
        intent = 'hydration_log'
        parameters = { amount: parseInt(match[1]) }
        response = `Registrados ${match[1]}ml de agua. ¡Mantén la hidratación!`
        await logHydration(parseInt(match[1]))
      }
    } else if (transcript.includes('comida') || transcript.includes('com')) {
      intent = 'nutrition_log'
      response = 'Comida registrada. ¡Nutrición de cazador!'
    } else if (transcript.includes('estado') || transcript.includes('progreso')) {
      intent = 'status_check'
      response = `Nivel ${profile.level}, ${profile.current_xp}/${profile.xp_to_next_level} XP. Racha actual: ${profile.current_streak} días.`
    } else if (transcript.includes('misión') || transcript.includes('mision')) {
      intent = 'mission_status'
      response = 'Consultando estado de misiones diarias...'
    }

    const command: VoiceCommand = {
      command: transcript,
      intent,
      parameters,
      response
    }

    setLastCommand(command)

    // Guardar comando en la base de datos
    await supabase.from('voice_commands').insert({
      user_id: profile.id,
      command_text: transcript,
      command_type: intent,
      recognized_intent: intent,
      parameters,
      executed_successfully: intent !== 'unknown',
      response_text: response
    })

    // Respuesta por voz
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response)
      utterance.lang = 'es-ES'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const updateMissionProgress = async (exerciseType: string, amount: number) => {
    if (!profile) return

    const today = new Date().toISOString().split('T')[0]
    
    // Buscar misión correspondiente
    const { data: missions } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .eq('exercise_type', exerciseType)
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
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', profile.id)
          .single()

        if (profileData) {
          const newTotalXp = profileData.total_xp + mission.xp_reward
          let newCurrentXp = profileData.current_xp + mission.xp_reward
          let newLevel = profileData.level
          let newAvailablePoints = profileData.available_points
          let newXpToNext = profileData.xp_to_next_level

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
              total_missions_completed: profileData.total_missions_completed + 1
            })
            .eq('id', profile.id)
        }
      }
    }
  }

  const logHydration = async (amount: number) => {
    if (!profile) return

    await supabase.from('hydration_logs').insert({
      user_id: profile.id,
      amount_ml: amount,
      drink_type: 'water'
    })

    // Actualizar progreso de misión de agua
    await updateMissionProgress('water', amount)
  }

  return {
    isSupported,
    isListening,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    processVoiceCommand
  }
}