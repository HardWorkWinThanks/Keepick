import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationBadgeProps {
  count: number
  variant?: 'error' | 'warning' | 'primary'
  maxCount?: number
  className?: string
}

/**
 * 알림 배지 컴포넌트
 * 탭이나 버튼 위에 작은 원형 배지로 알림 수를 표시합니다.
 */
export function NotificationBadge({ 
  count, 
  variant = 'error', 
  maxCount = 99,
  className = '' 
}: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()
  
  const variantStyles = {
    error: 'bg-[#D22016] text-white',
    warning: 'bg-yellow-500 text-black',
    primary: 'bg-[#FE7A25] text-white'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          duration: 0.3 
        }}
        className={`
          absolute -top-1 -right-1 
          min-w-[18px] h-[18px] 
          rounded-full 
          flex items-center justify-center
          text-[10px] font-bold
          border border-gray-900
          shadow-lg
          ${variantStyles[variant]}
          ${className}
        `}
      >
        {displayCount}
      </motion.div>
    </AnimatePresence>
  )
}