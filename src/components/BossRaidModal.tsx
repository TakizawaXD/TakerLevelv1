import React from 'react'
import { motion } from 'framer-motion'
import { X, Target, Crown, Zap, Flame, Skull } from 'lucide-react'
import { SystemWindow } from './ui/SystemWindow'
import { GlowButton } from './ui/GlowButton'
import { StatBar } from './ui/StatBar'
import { BossFight } from '../hooks/useGameData'

interface BossRaidModalProps {
  bossRaids: BossFight[]
  onClose: () => void
}

export function BossRaidModal({ bossRaids, onClose }: BossRaidModalProps) {
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢'
      case 'medium': return '🟡'
      case 'hard': return '🟠'
      case 'extreme': return '🔴'
      case 'legendary': return '🟣'
      default: return '⚪'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-green-500/30 bg-green-900/20'
      case 'medium': return 'border-yellow-500/30 bg-yellow-900/20'
      case 'hard': return 'border-orange-500/30 bg-orange-900/20'
      case 'extreme': return 'border-red-500/30 bg-red-900/20'
      case 'legendary': return 'border-purple-500/30 bg-purple-900/20'
      default: return 'border-slate-500/30 bg-slate-900/20'
    }
  }

  const getBossIcon = (title: string) => {
    if (title.includes('Fuego') || title.includes('Racha')) return <Flame className="w-8 h-8 text-red-400" />
    if (title.includes('Velocista') || title.includes('Sombra')) return <Zap className="w-8 h-8 text-green-400" />
    if (title.includes('Fuerza') || title.includes('Absoluta')) return <Target className="w-8 h-8 text-orange-400" />
    if (title.includes('Maestro') || title.includes('Estratega')) return <Crown className="w-8 h-8 text-blue-400" />
    if (title.includes('Legendario') || title.includes('Cazador')) return <Skull className="w-8 h-8 text-purple-400" />
    return <Target className="w-8 h-8 text-slate-400" />
  }

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
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <SystemWindow title="⚔️ BOSS RAIDS ACTIVOS">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-slate-400">
                Los Boss Raids son desafíos épicos que requieren dedicación y constancia. 
                Completa estos desafíos para obtener recompensas legendarias.
              </p>
            </div>

            {bossRaids.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No hay Boss Raids activos</h3>
                <p className="text-slate-500">Completa más entrenamientos para desbloquear nuevos desafíos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bossRaids.map((boss) => (
                  <motion.div
                    key={boss.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-6 border-2 ${getDifficultyColor(boss.difficulty)} hover:scale-105 transition-transform`}
                  >
                    {/* Boss Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getBossIcon(boss.title)}
                        <div>
                          <h3 className="text-white font-bold text-lg">{boss.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getDifficultyIcon(boss.difficulty)}</span>
                            <span className="text-sm font-medium text-slate-300 uppercase">
                              {boss.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boss Description */}
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      {boss.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <StatBar
                        label="Progreso"
                        current={boss.current_progress}
                        max={boss.target_value}
                        color={boss.difficulty === 'legendary' ? 'purple' : 
                               boss.difficulty === 'extreme' ? 'red' :
                               boss.difficulty === 'hard' ? 'orange' : 'blue'}
                      />
                    </div>

                    {/* Reward Section */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                        🏆 RECOMPENSA
                      </h4>
                      <p className="text-slate-300 text-sm">{boss.reward_description}</p>
                      
                      {boss.reward_stats && Object.keys(boss.reward_stats).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(boss.reward_stats).map(([stat, value]) => (
                            <span
                              key={stat}
                              className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-blue-300 text-xs font-medium"
                            >
                              +{value} {stat.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Boss Type Info */}
                    <div className="mt-4 text-center">
                      <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                        Tipo: {boss.boss_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-bold mb-3 flex items-center gap-2">
                💡 Consejos para Boss Raids
              </h4>
              <ul className="text-blue-200 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Los Boss Raids se actualizan automáticamente según tu progreso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Las recompensas de dificultad mayor otorgan más puntos de estadística</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Algunos desafíos requieren constancia diaria para completarse</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Los Boss Raids legendarios otorgan títulos únicos y grandes bonificaciones</span>
                </li>
              </ul>
            </div>

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
        </SystemWindow>
      </motion.div>
    </motion.div>
  )
}