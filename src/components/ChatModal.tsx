import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Message {
  from: 'user' | 'bot'
  text: string
}

interface ChatModalProps {
  onClose: () => void
}

export function ChatModal({ onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = { from: 'user', text: input }
    const botResponse: Message = {
      from: 'bot',
      text: `🤖 Aún no tengo conexión a IA, pero recibí: "${input}"`,
    }

    setMessages([...messages, userMessage, botResponse])
    setInput('')
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-slate-900 rounded-lg w-full max-w-md p-4 relative shadow-lg"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-white font-bold text-lg mb-4">🗨️ Chat con tu Asistente</h2>

          <div className="h-64 overflow-y-auto bg-slate-800 rounded p-3 space-y-2 mb-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded ${
                  msg.from === 'user'
                    ? 'bg-blue-600 text-white self-end ml-auto max-w-[80%]'
                    : 'bg-slate-700 text-slate-100 self-start mr-auto max-w-[80%]'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Enviar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
