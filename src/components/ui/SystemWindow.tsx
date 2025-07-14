import React from 'react'
import { motion } from 'framer-motion'

interface SystemWindowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function SystemWindow({ title, children, className = '' }: SystemWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border-2 border-blue-500/30 shadow-2xl ${className}`}
      style={{
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
      }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-t-md border-b border-blue-500/30">
        <h2 className="text-white font-bold text-lg tracking-wide">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  )
}