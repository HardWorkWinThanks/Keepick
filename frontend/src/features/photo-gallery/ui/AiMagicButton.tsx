"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"

interface AiMagicButtonProps {
  onAiServiceClick: () => void
}

export default function AiMagicButton({ onAiServiceClick }: AiMagicButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={onAiServiceClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative px-6 py-2 bg-transparent border-2 border-blue-500 text-blue-400 hover:text-white hover:bg-blue-500/10 font-keepick-primary text-sm tracking-wider transition-all duration-300 flex items-center justify-center overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 배경 반짝임 효과 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-400/30 to-blue-500/20 rounded-sm"
            />
          )}
        </AnimatePresence>

        {/* 아이콘과 반짝임 파티클들 */}
        <div className="relative flex items-center justify-center">
          <Sparkles size={16} className="relative z-10" />
          
          {/* 주변 반짝임 파티클들 */}
          <motion.div
            animate={isHovered ? { 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            } : { rotate: 0, scale: 1 }}
            transition={{ 
              duration: 2, 
              repeat: isHovered ? Infinity : 0,
              ease: "linear" 
            }}
            className="absolute inset-0"
          >
            <div className="absolute -top-1 -left-1 w-1 h-1 bg-blue-400 rounded-full opacity-60" />
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-blue-400 rounded-full opacity-80" />
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full opacity-70" />
            <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-blue-400 rounded-full opacity-60" />
          </motion.div>
        </div>
      </motion.button>
      {/* <span className="text-xs text-gray-400 font-keepick-primary">AI</span> */}
    </div>
  )
}