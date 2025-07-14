import React from 'react'
import { motion } from 'framer-motion'

interface StatBarProps {
  label: string
  current: number
  max: number
  color?: string
  showNumbers?: boolean
}

export function StatBar({ label, current, max, color = 'blue', showNumbers = true }: StatBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-slate-300 font-medium">{label}</span>
        {showNumbers && (
          <span className="text-slate-400 text-sm">{current}/{max}</span>
        )}
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            boxShadow: `0 0 10px rgba(59, 130, 246, 0.5)`
          }}
        />
      </div>
    </div>
  )
}