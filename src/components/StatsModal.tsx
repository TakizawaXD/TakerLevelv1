import React from 'react'
import { motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { useUserProfile, UserProfile } from '../hooks/useUserProfile'

interface StatsModalProps {
  profile: UserProfile
  onClose: () => void
}

export function StatsModal({ profile, onClose }: StatsModalProps) {
  const { allocateStatPoint } = useUserProfile()

  const handleAllocatePoint = async (stat: keyof Pick<UserProfile, 'str' | 'agi' | 'int' | 'vit' | 'cha'>) => {
    await allocateStatPoint(stat)
    if (profile.available_points <= 1) {
      onClose()
    }
  }

  const stats = [
    { 
      key: 'str' as const, 
      name: 'STR', 
      fullName: 'Fuerza',
      description: 'Aumenta tu poder físico y capacidad de levantamiento', 
      color: 'text-red-400', 
      icon: '💪',
      benefits: ['Más fuerza en ejercicios', 'Mayor resistencia muscular', 'Mejor rendimiento en pesas']
    },
    { 
      key: 'agi' as const, 
      name: 'AGI', 
      fullName: 'Agilidad',
      description: 'Mejora tu velocidad, coordinación y reflejos', 
      color: 'text-green-400', 
      icon: '⚡',
      benefits: ['Mayor velocidad', 'Mejor coordinación', 'Reflejos más rápidos']
    },
    { 
      key: 'int' as const, 
      name: 'INT', 
      fullName: 'Inteligencia',
      description: 'Desarrolla tu capacidad mental y estratégica', 
      color: 'text-blue-400', 
      icon: '🧠',
      benefits: ['Mejor planificación', 'Estrategias más efectivas', 'Aprendizaje acelerado']
    },
    { 
      key: 'vit' as const, 
      name: 'VIT', 
      fullName: 'Vitalidad',
      description: 'Incrementa tu resistencia y capacidad de recuperación', 
      color: 'text-orange-400', 
      icon: '❤️',
      benefits: ['Mayor resistencia', 'Recuperación más rápida', 'Mejor salud general']
    },
    { 
      key: 'cha' as const, 
      name: 'CHA', 
      fullName: 'Carisma',
      description: 'Fortalece tu presencia y confianza personal', 
      color: 'text-purple-400', 
      icon: '✨',
      benefits: ['Mayor confianza', 'Mejor presencia', 'Liderazgo natural']
    },
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
        <SystemWindow title="⚡ DISTRIBUCIÓN DE PUNTOS">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="text-yellow-400 font-bold text-2xl">
                ⭐ {profile.available_points} puntos disponibles
              </span>
              <p className="text-slate-400 text-sm mt-2">
                Distribuye tus puntos sabiamente, cazador. Cada punto mejora permanentemente tus habilidades.
              </p>
            </div>

            {stats.map((stat) => (
              <div
                key={stat.key}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-center">
                      <span className="text-3xl">{stat.icon}</span>
                      <div className="mt-2">
                        <div className={`font-bold text-lg ${stat.color}`}>{stat.name}</div>
                        <div className="text-white text-2xl font-bold">{profile[stat.key]}</div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">{stat.fullName}</h3>
                      <p className="text-slate-300 text-sm mb-3">{stat.description}</p>
                      
                      <div className="space-y-1">
                        <p className="text-slate-400 text-xs font-medium">Beneficios:</p>
                        {stat.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                            <span className="text-slate-400 text-xs">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <GlowButton
                    onClick={() => handleAllocatePoint(stat.key)}
                    disabled={profile.available_points <= 0}
                    variant="success"
                    className="px-4 py-2 ml-4"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    +1
                  </GlowButton>
                </div>
              </div>
            ))}

            <div className="mt-8 pt-6 border-t border-slate-700">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h4 className="text-blue-300 font-bold mb-2">💡 Consejos de Distribución</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• <strong>STR:</strong> Ideal para entrenamientos de fuerza y pesas</li>
                  <li>• <strong>AGI:</strong> Perfecto para cardio, deportes y actividades dinámicas</li>
                  <li>• <strong>INT:</strong> Ayuda en la planificación y optimización de rutinas</li>
                  <li>• <strong>VIT:</strong> Esencial para resistencia y recuperación</li>
                  <li>• <strong>CHA:</strong> Mejora tu motivación y presencia personal</li>
                </ul>
              </div>

              <GlowButton
                onClick={onClose}
                variant="secondary"
                className="w-full"
              >
                Cerrar
              </GlowButton>
            </div>
          </div>
        </SystemWindow>
      </motion.div>
    </motion.div>
  )
}