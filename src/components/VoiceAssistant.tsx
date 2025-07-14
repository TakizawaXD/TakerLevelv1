import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, MessageCircle } from 'lucide-react'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import { GlowButton } from './ui/GlowButton'

export function VoiceAssistant() {
  const {
    isSupported,
    isListening,
    transcript,
    lastCommand,
    startListening,
    stopListening
  } = useVoiceCommands()
  
  const [showTranscript, setShowTranscript] = useState(false)

  if (!isSupported) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end gap-3">
        {/* Transcript Display */}
        <AnimatePresence>
          {(showTranscript && (transcript || lastCommand)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-slate-900/95 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 max-w-sm"
            >
              {transcript && (
                <div className="mb-2">
                  <div className="text-blue-300 text-xs font-medium mb-1">Escuchando:</div>
                  <div className="text-white text-sm">{transcript}</div>
                </div>
              )}
              {lastCommand && (
                <div>
                  <div className="text-green-300 text-xs font-medium mb-1">Último comando:</div>
                  <div className="text-white text-sm mb-2">{lastCommand.command}</div>
                  <div className="text-slate-300 text-xs">{lastCommand.response}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Controls */}
        <div className="flex gap-2">
          <GlowButton
            onClick={() => setShowTranscript(!showTranscript)}
            variant="secondary"
            className="p-3"
          >
            <MessageCircle className="w-5 h-5" />
          </GlowButton>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <GlowButton
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "danger" : "primary"}
              className={`p-4 ${isListening ? 'animate-pulse' : ''}`}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </GlowButton>
          </motion.div>
        </div>

        {/* Voice Status */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-sm font-medium">Escuchando...</span>
            </div>
          </motion.div>
        )}

        {/* Voice Commands Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 max-w-xs"
        >
          <h4 className="text-red-300 font-bold text-sm mb-2">🎤 Asistente de Voz:</h4>
          <p className="text-red-200 text-xs">
            Habla naturalmente para registrar ejercicios, hidratación y consultar tu progreso. 
            El sistema entenderá tus comandos automáticamente.
          </p>
        </motion.div>
      </div>
    </div>
  )
}