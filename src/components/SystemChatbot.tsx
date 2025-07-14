import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, X, Bot, User, Zap, Target, Dumbbell, Droplets, Utensils, Volume2, VolumeX
} from 'lucide-react';
import { SystemWindow } from './ui/SystemWindow';
import { GlowButton } from './ui/GlowButton';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';

// Definición de interfaces para los mensajes del chat y las acciones
interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatAction {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

// **IMPORTANTE**: Para producción, se recomienda encarecidamente usar variables de entorno.
// Crea un archivo .env en la raíz de tu proyecto (junto a package.json)
// y añade: VITE_GEMINI_API_KEY=TU_CLAVE_API_DE_GEMINI
// Luego, reinicia tu servidor de desarrollo.
// Asegúrate de que la clave que uses sea TU CLAVE REAL de Google AI Studio, no el placeholder.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function SystemChatbot() {
  const { profile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true); // Estado para habilitar/deshabilitar voz
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para inicializar el chat con el mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen, profile, messages.length]); // Añadido messages.length para evitar re-inicialización

  // Efecto para hacer scroll al final de los mensajes cada vez que se actualizan
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `🔥 ¡Saludos, Cazador ${profile?.username || 'Novato'}! 

Soy el SYSTEM REAPER, tu asistente personal de entrenamiento. Estoy aquí para ayudarte en tu evolución de Rango E a Rango S.

**¿En qué puedo ayudarte hoy?**`,
      timestamp: new Date(),
      actions: [
        {
          label: '📋 Ver Misiones',
          action: () => handleQuickAction('missions'),
          icon: <Target className="w-4 h-4" />
        },
        {
          label: '💪 Entrenar',
          action: () => handleQuickAction('workout'),
          icon: <Dumbbell className="w-4 h-4" />
        },
        {
          label: '📊 Mi Progreso',
          action: () => handleQuickAction('progress'),
          icon: <Zap className="w-4 h-4" />
        }
      ]
    };
    setMessages([welcomeMessage]);
    speakText(welcomeMessage.content); // Habla el mensaje de bienvenida
  };

  // Función para síntesis de voz (Text-to-Speech)
  const speakText = (text: string) => {
    if (!isSpeakingEnabled || !window.speechSynthesis) {
      console.warn("Speech synthesis not enabled or not supported by browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Establece el idioma a español de España
    utterance.pitch = 1;     // Tono (0 a 2, 1 es normal)
    utterance.rate = 1.1;    // Velocidad (0.1 a 10, 1 es normal)

    // Detener cualquier síntesis de voz actual antes de iniciar una nueva
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Función para alternar la síntesis de voz
  const toggleSpeaking = () => {
    if (isSpeakingEnabled) {
      window.speechSynthesis.cancel(); // Detener cualquier voz si se deshabilita
    }
    setIsSpeakingEnabled(prev => !prev);
  };

  const handleQuickAction = (action: string) => {
    let response = '';
    let actions: ChatAction[] = [];

    switch (action) {
      case 'missions':
        response = `📋 **MISIONES DIARIAS ACTIVAS**

🔴 **OBLIGATORIAS** (Penalización si no completas):
• 💪 100 Flexiones
• 🔥 100 Abdominales 
• 🦵 100 Sentadillas
• 🏃 Correr 10km

🔵 **BONUS**:
• 💧 Beber 2.5L de agua
• 🥗 3 comidas saludables

¿Quieres registrar progreso en alguna misión?`;
        actions = [
          {
            label: 'Registrar Ejercicio',
            action: () => handleQuickAction('log_exercise')
          },
          {
            label: 'Registrar Agua',
            action: () => handleQuickAction('log_water')
          }
        ];
        break;

      case 'workout':
        response = `💪 **SISTEMA DE ENTRENAMIENTO**

Nivel actual: **${profile?.level || 1}**
XP actual: **${profile?.current_xp || 0}/${profile?.xp_to_next_level || 100}**

**Tipos de entrenamiento disponibles:**
• 🔥 Fullbody (25-40 XP)
• 💪 Fuerza (20-35 XP)
• 🏃 Cardio (15-30 XP)
• 🧘 Flexibilidad (10-20 XP)

¿Qué tipo de entrenamiento quieres hacer?`;
        actions = [
          {
            label: 'Fullbody',
            action: () => handleWorkoutType('fullbody')
          },
          {
            label: 'Cardio',
            action: () => handleWorkoutType('cardio')
          }
        ];
        break;

      case 'progress':
        response = `📊 **TU PROGRESO ACTUAL**

**Stats del Cazador:**
• STR: ${profile?.str || 1}
• AGI: ${profile?.agi || 1}
• INT: ${profile?.int || 1}
• VIT: ${profile?.vit || 1}
• CHA: ${profile?.cha || 1}

**Progresión:**
• Nivel: ${profile?.level || 1}
• XP Total: ${profile?.total_xp || 0}
• Entrenamientos: ${profile?.total_workouts || 0}
• Racha actual: ${profile?.current_streak || 0} días

¡Sigue así, Cazador! Tu evolución es impresionante.`;
        break;

      case 'log_exercise':
        response = `💪 **REGISTRO DE EJERCICIO**

Dime qué ejercicio completaste y cuántas repeticiones:

**Ejemplos:**
• "50 flexiones"
• "30 abdominales"
• "2 kilómetros"

También puedes usar comandos de voz presionando el botón del micrófono.`;
        break;

      case 'log_water':
        response = `💧 **REGISTRO DE HIDRATACIÓN**

¿Cuánta agua bebiste?

**Opciones rápidas:**
• 250ml (1 vaso)
• 500ml (1 botella)
• 1000ml (1 litro)

Escribe la cantidad o usa los botones rápidos.`;
        actions = [
          {
            label: '250ml',
            action: () => logHydration(250),
            icon: <Droplets className="w-4 h-4" />
          },
          {
            label: '500ml',
            action: () => logHydration(500),
            icon: <Droplets className="w-4 h-4" />
          },
          {
            label: '1000ml',
            action: () => logHydration(1000),
            icon: <Droplets className="w-4 h-4" />
          }
        ];
        break;
      default:
        response = 'Acción rápida no reconocida.';
    }

    addMessage('user', `Acción: ${action}`); // Log the user's "action"
    setTimeout(() => {
      addMessage('system', response, actions);
      speakText(response); // Habla la respuesta del sistema
    }, 500);
  };

  const handleWorkoutType = (type: string) => {
    const response = `🔥 **ENTRENAMIENTO ${type.toUpperCase()}**

¡Excelente elección, Cazador! 

**Duración recomendada:** 30-45 minutos
**XP estimado:** 25-40 XP según intensidad

¿Quieres que te guíe con una rutina específica o prefieres entrenar libre?`;

    addMessage('user', `Quiero entrenar ${type}`);
    setTimeout(() => {
      addMessage('system', response, [
        {
          label: 'Rutina Guiada',
          action: () => startGuidedWorkout(type)
        },
        {
          label: 'Entrenamiento Libre',
          action: () => startFreeWorkout(type)
        }
      ]);
      speakText(response); // Habla la respuesta del sistema
    }, 500);
  };

  const startGuidedWorkout = (type: string) => {
    const routines = {
      fullbody: [
        '20 Flexiones',
        '30 Sentadillas',
        '20 Abdominales',
        '1 min Plancha',
        'Descanso 2 min',
        'Repetir 3 series'
      ],
      cardio: [
        '5 min Calentamiento',
        '20 min Carrera/Bicicleta',
        '10 Burpees',
        '5 min Enfriamiento'
      ]
    };

    const routine = routines[type as keyof typeof routines] || [];
    const response = `🎯 **RUTINA ${type.toUpperCase()} ACTIVADA**

${routine.map((exercise, index) => `${index + 1}. ${exercise}`).join('\n')}

¡Vamos, Cazador! Cada repetición te acerca más a tu evolución. ¿Listo para comenzar?`;

    addMessage('system', response, [
      {
        label: '🚀 ¡Comenzar!',
        action: () => {
          const startMessage = '⚡ ¡Entrenamiento iniciado! Recuerda mantener buena forma y respirar correctamente. ¡Tú puedes, Cazador!';
          addMessage('system', startMessage);
          speakText(startMessage); // Habla la respuesta del sistema
        }
      }
    ]);
    speakText(response); // Habla la respuesta del sistema
  };

  const startFreeWorkout = (type: string) => {
    const response = `🔥 **ENTRENAMIENTO LIBRE ACTIVADO**

¡Perfecto! Entrena a tu ritmo, Cazador.

**Consejos del Sistema:**
• Mantén buena forma en cada ejercicio
• Descansa entre series
• Hidrátate constantemente
• Escucha a tu cuerpo

Cuando termines, regístrame tu entrenamiento para ganar XP.`
;
    addMessage('system', response);
    speakText(response); // Habla la respuesta del sistema
  };

  const logHydration = async (amount: number) => {
    if (!profile) return;

    try {
      await supabase.from('hydration_logs').insert({
        user_id: profile.id,
        amount_ml: amount,
        drink_type: 'water'
      });

      const successMessage = `💧 ¡Excelente! Registré ${amount}ml de agua. 

Tu hidratación es clave para el rendimiento, Cazador. ¡Sigue así!`;
      addMessage('system', successMessage);
      speakText(successMessage); // Habla el mensaje de éxito
    } catch (error) {
      const errorMessage = '❌ Error al registrar hidratación. Inténtalo de nuevo.';
      addMessage('system', errorMessage);
      speakText(errorMessage); // Habla el mensaje de error
    }
  };

  const callGeminiAPI = async (prompt: string) => {
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY no está configurada. Por favor, asegúrate de tener un archivo .env en la raíz de tu proyecto con la variable VITE_GEMINI_API_KEY=TU_CLAVE_REAL_AQUI.");
        return "Lo siento, la función de IA no está configurada correctamente. Contacta al administrador del sistema.";
    }

    try {
      // Usamos gemini-2.0-flash como lo indicaste en tu curl
      const modelName = "gemini-2.0-flash"; 

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Incluye el mensaje de error de la API directamente
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message || 'No se recibió mensaje de error específico.'}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
      return aiText;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // Devuelve el mensaje de error directamente al usuario si es una instancia de Error
      return (error instanceof Error) ? `Lo siento, hubo un error con la IA: ${error.message}` : 'Lo siento, no pude obtener una respuesta de la IA en este momento.';
    }
  };

  const processUserMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase();

    const aiResponses = {
      greeting: [
        "🔥 ¡Saludos, Cazador! El sistema está listo para tu evolución.",
        "⚡ ¡Bienvenido de vuelta! Tu progreso me impresiona cada día.",
        "👑 ¡El sistema te reconoce, Cazador! ¿Listo para superar tus límites?"
      ],
      motivation: [
        "🔥 Recuerda: Sung Jin-Woo empezó siendo el más débil y se convirtió en el Monarca de las Sombras. ¡Tu evolución apenas comienza!",
        "⚡ Cada flexión, cada kilómetro, cada gota de sudor te acerca más a tu verdadero poder. ¡No te detengas!",
        "👑 Los cazadores de élite no nacen, se forjan. Cada entrenamiento es un paso hacia la grandeza.",
        "🌟 El sistema te eligió por una razón. Confía en el proceso y en tu potencial ilimitado.",
        "💪 Hoy eres más fuerte que ayer. Mañana serás más fuerte que hoy. ¡Esa es la ley del crecimiento!",
        "🎯 Tu determinación es tu arma más poderosa. Úsala para conquistar cada desafío.",
        "⚔️ En el mundo de los cazadores, solo los persistentes alcanzan la cima. ¡Tú tienes esa persistencia!"
      ],
      tips: [
        "💡 **Tip del Sistema:** Mantén una rutina constante. La consistencia es más importante que la intensidad.",
        "🎯 **Consejo de Cazador:** Enfócate en la forma correcta antes que en la velocidad. Calidad sobre cantidad.",
        "⚡ **Sabiduría del Sistema:** Descansa adecuadamente. El crecimiento ocurre durante la recuperación.",
        "🔥 **Estrategia Élite:** Combina cardio y fuerza para un desarrollo completo de tus habilidades.",
        "💧 **Regla de Oro:** Hidrátate antes, durante y después del entrenamiento. Tu cuerpo es tu arma más importante.",
        "🧠 **Técnica Mental:** Visualiza tu éxito antes de cada entrenamiento. La mente guía al cuerpo.",
        "⚖️ **Balance Perfecto:** 70% entrenamiento, 20% nutrición, 10% descanso. Esta es la fórmula del éxito."
      ]
    };

    // Detectar saludos
    if (lowerMessage.includes('hola') || lowerMessage.includes('hey') || lowerMessage.includes('buenas')) {
      const randomGreeting = aiResponses.greeting[Math.floor(Math.random() * aiResponses.greeting.length)];
      addMessage('system', randomGreeting);
      speakText(randomGreeting); 
      return;
    }

    // Detectar números y ejercicios para registro
    const exercisePatterns = [
      { pattern: /(\d+)\s*(flexion|flexiones|push\s*up)/i, exercise: 'pushups', unit: 'reps' },
      { pattern: /(\d+)\s*(abdominal|abdominales|sit\s*up)/i, exercise: 'situps', unit: 'reps' },
      { pattern: /(\d+)\s*(sentadilla|sentadillas|squat)/i, exercise: 'squats', unit: 'reps' },
      { pattern: /(\d+(?:\.\d+)?)\s*(km|kilómetro|kilómetros)/i, exercise: 'running', unit: 'km' },
      { pattern: /(\d+)\s*(ml|mililitro|agua)/i, exercise: 'water', unit: 'ml' }
    ];

    for (const { pattern, exercise, unit } of exercisePatterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        await logExercise(exercise, amount, unit);
        return;
      }
    }

    // Handle "explain AI" using Gemini API
    if (lowerMessage.includes('explica la ia') || lowerMessage.includes('como funciona la ia') || lowerMessage.includes('que es la ia')) {
      setIsTyping(true);
      // Aquí, usa una pregunta más directa y menos "role-play" para Gemini,
      // para obtener una respuesta más técnica y precisa.
      const aiExplanation = await callGeminiAPI("Explica el funcionamiento básico de una inteligencia artificial (IA) de forma sencilla.");
      setIsTyping(false);
      addMessage('system', aiExplanation);
      speakText(aiExplanation); 
      return;
    }

    // Respuestas contextuales predefinidas
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
      const helpMessage = `🤖 **COMANDOS DISPONIBLES**

**Registro rápido:**
• "50 flexiones" - Registra ejercicio
• "2 kilómetros" - Registra carrera 
• "500ml agua" - Registra hidratación

**Información:**
• "misiones" - Ver misiones diarias
• "progreso" - Ver tu progreso
• "stats" - Ver estadísticas

**Motivación:**
• "motivación" - Palabras de ánimo
• "consejo" - Tips de entrenamiento
• "explica la IA" - Para saber más del sistema

¿En qué más puedo ayudarte, Cazador?`;
      addMessage('system', helpMessage);
      speakText(helpMessage); 
      return;
    }

    if (lowerMessage.includes('motivación') || lowerMessage.includes('motivacion')) {
      const motivationalMessages = aiResponses.motivation;
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      addMessage('system', randomMessage);
      speakText(randomMessage); 
      return;
    }

    if (lowerMessage.includes('consejo') || lowerMessage.includes('tip')) {
      const tips = aiResponses.tips;
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      addMessage('system', randomTip);
      speakText(randomTip); 
      return;
    }

    // Respuesta por defecto utilizando Gemini si no se maneja con respuestas rápidas
    setIsTyping(true);
    // Ajustado el prompt para Gemini para ser más genérico si no encaja con los comandos.
    const geminiResponse = await callGeminiAPI(`Como asistente de fitness 'System Reaper' de un RPG (similar a Solo Leveling), responde a la siguiente consulta del usuario de manera concisa y en tu tono característico. Si la consulta no está relacionada con fitness o no la entiendes bien, redirige al usuario a los comandos conocidos ("ayuda", "misiones", "entrenar", "progreso"). Consulta: "${message}". Contexto del usuario: Nivel ${profile?.level}, STR ${profile?.str}, AGI ${profile?.agi}, INT ${profile?.int}, VIT ${profile?.vit}, CHA ${profile?.cha}.`);
    setIsTyping(false);
    addMessage('system', geminiResponse);
    speakText(geminiResponse); 
  };

  const logExercise = async (exercise: string, amount: number, unit: string) => {
    if (!profile) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Busca una misión incompleta para hoy y este tipo de ejercicio
      const { data: missions, error: missionsError } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .eq('exercise_type', exercise)
        .eq('completed', false);

      if (missionsError) throw missionsError;

      if (missions && missions.length > 0) {
        const mission = missions[0];
        const newProgress = Math.min(mission.current_progress + amount, mission.target_value);
        const completed = newProgress >= mission.target_value;

        const { error: updateError } = await supabase
          .from('daily_missions')
          .update({
            current_progress: newProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          })
          .eq('id', mission.id);

        if (updateError) throw updateError;

        if (completed) {
          const successMessage = `🎉 ¡MISIÓN COMPLETADA! 

${mission.title} - +${mission.xp_reward} XP

¡Excelente trabajo, Cazador! Tu dedicación es admirable.`;
          addMessage('system', successMessage);
          speakText(successMessage); 
        } else {
          const progressMessage = `✅ Registrado: ${amount} ${unit} de ${exercise}

Progreso en misión: ${newProgress}/${mission.target_value}
¡Sigue así, Cazador!`;
          addMessage('system', progressMessage);
          speakText(progressMessage); 
        }
      } else {
        const genericMessage = `✅ Registrado: ${amount} ${unit} de ${exercise}

¡Buen trabajo! Cada esfuerzo cuenta en tu evolución.`;
        addMessage('system', genericMessage);
        speakText(genericMessage); 
      }
    } catch (error: any) {
      console.error('Error logging exercise:', error.message);
      const errorMessage = '❌ Error al registrar ejercicio. Inténtalo de nuevo.';
      addMessage('system', errorMessage);
      speakText(errorMessage); 
    }
  };

  const addMessage = (type: 'user' | 'system', content: string, actions?: ChatAction[]) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      actions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);

    setIsTyping(true);
    // Simula un pequeño delay antes de procesar el mensaje y obtener la respuesta de la IA
    setTimeout(async () => {
      await processUserMessage(userMessage);
      setIsTyping(false);
    }, 1000); // Simula 1 segundo de "escritura" de la IA
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón para abrir/cerrar el Chatbot */}
      <motion.div
        className="fixed bottom-6 left-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <GlowButton
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 rounded-full"
          title="Abrir Chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </GlowButton>
      </motion.div>

      {/* Ventana del Chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            // Ajuste de la posición: Revertido a bottom-24 para que no estorbe
            className="fixed bottom-24 left-6 w-96 h-[500px] z-50"
          >
            <SystemWindow title="🤖 SYSTEM REAPER - Asistente">
              {/* Barra superior con botones de cerrar y activar/desactivar voz */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={toggleSpeaking}
                  className="text-slate-400 hover:text-white transition-colors"
                  title={isSpeakingEnabled ? 'Deshabilitar voz' : 'Habilitar voz'}
                >
                  {isSpeakingEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.speechSynthesis.cancel(); // Detener voz al cerrar
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Cerrar Chatbot"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col h-[400px] pt-10"> {/* Espacio para los botones de la barra superior */}
                {/* Contenedor de mensajes */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}>
                        <div className="flex items-start gap-2 mb-2">
                          {message.type === 'system' ? (
                            <Bot className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                          )}
                          <div className="text-sm whitespace-pre-line">{message.content}</div>
                        </div>

                        {message.actions && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {message.actions.map((action, index) => (
                              <button
                                key={index}
                                onClick={action.action}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-full transition-colors"
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Indicador de escritura de la IA */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-400" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Campo de entrada de texto y botón de enviar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <GlowButton
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping} // Deshabilita el botón de enviar mientras se escribe o la IA está "pensando"
                    className="px-3 py-2"
                  >
                    <Send className="w-4 h-4" />
                  </GlowButton>
                </div>
              </div>
            </SystemWindow>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}