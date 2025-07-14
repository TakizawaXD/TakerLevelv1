import React from 'react'
import { motion } from 'framer-motion'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  disabled?: boolean
  className?: string
}

export function GlowButton({ children, onClick, variant = 'primary', disabled = false, className = '' }: GlowButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25',
    secondary: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-slate-500/25',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/25',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-bold text-white tracking-wide
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}
        transition-all duration-200 border border-white/10
        ${className}
      `}
      style={!disabled ? {
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
      } : {}}
    >
      {children}
    </motion.button>
  )
}