import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { useAuth } from '../hooks/useAuth'

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('El nombre de cazador es requerido')
        }
        const { error } = await signUp(email, password, {
          username: username.trim(),
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          date_of_birth: dateOfBirth || null,
          gender,
          height_cm: height ? parseInt(height) : null,
          weight_kg: weight ? parseFloat(weight) : null,
          fitness_level: fitnessLevel
        })
        if (error) throw error
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (error: any) {
      setError(error.message || 'Ha ocurrido un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-red-600 mb-2">
            SYSTEM REAPER
          </h1>
          <p className="text-slate-400">Solo Leveling Fitness System</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-slate-500 text-sm">Versión 3.0 - Sistema Completo</p>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>

        <SystemWindow title={isSignUp ? "🆕 CREAR CAZADOR" : "⚔️ ACCESO AL SISTEMA"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="cazador@sistema.com"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Nombre de Cazador *
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Sung Jin-Woo"
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Tu nombre real"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Género
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="175"
                      min="100"
                      max="250"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="70"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Nivel de Fitness
                  </label>
                  <select
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value as any)}
                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="beginner">🟢 Principiante - Recién empiezo</option>
                    <option value="intermediate">🟡 Intermedio - Entreno regularmente</option>
                    <option value="advanced">🟠 Avanzado - Entreno intensamente</option>
                    <option value="expert">🔴 Experto - Atleta/Competidor</option>
                  </select>
                </div>
              </>
            )}

            <GlowButton 
              type="submit" 
              disabled={loading}
              className="w-full py-4 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                isSignUp ? '🚀 Activar Sistema' : '⚡ Acceder'
              )}
            </GlowButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isSignUp ? '¿Ya eres cazador? Inicia sesión' : '¿Nuevo cazador? Créate una cuenta'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm text-center">
              🗄️ Datos sincronizados con Supabase
            </p>
          </div>

          {isSignUp && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <h4 className="text-red-300 font-bold text-sm mb-2">🎮 SYSTEM REAPER - Características:</h4>
              <ul className="text-red-200 text-xs space-y-1">
                <li>• Misiones diarias obligatorias estilo Solo Leveling</li>
                <li>• Contador de ejercicios en tiempo real con voz</li>
                <li>• Sistema completo de nutrición e hidratación</li>
                <li>• Boss Raids con recompensas épicas</li>
                <li>• Comandos de voz para registro automático</li>
                <li>• Progreso sincronizado entre dispositivos</li>
                <li>• Penalizaciones por no completar misiones</li>
              </ul>
            </div>
          )}
        </SystemWindow>
      </div>
    </div>
  )
}