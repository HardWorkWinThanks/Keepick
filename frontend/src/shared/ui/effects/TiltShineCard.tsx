'use client'

import { useState, useRef, useEffect } from 'react'

interface TiltShineCardProps {
  children: React.ReactNode
  effectColor?: string // 글로우 효과 색상
  intensity?: number // 효과 강도 (0-1)
  disabled?: boolean // 효과 비활성화
  className?: string
}

export const TiltShineCard: React.FC<TiltShineCardProps> = ({ 
  children, 
  effectColor = "#FE7A25", 
  intensity = 1,
  disabled = false,
  className = "" 
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [shine, setShine] = useState({ x: 50, y: 50 })
  const rafRef = useRef<number | undefined>(undefined)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!wrapperRef.current || disabled) return
    
    // 애니메이션 프레임 최적화
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const tiltX = ((e.clientY - cy) / 15) * intensity // 감도와 강도 조절
      const tiltY = ((cx - e.clientX) / 15) * intensity // 감도와 강도 조절
      const shineX = ((e.clientX - rect.left) / rect.width) * 100
      const shineY = ((e.clientY - rect.top) / rect.height) * 100
      setTilt({ 
        x: Math.max(-10 * intensity, Math.min(10 * intensity, tiltX)), 
        y: Math.max(-10 * intensity, Math.min(10 * intensity, tiltY)) 
      })
      setShine({ x: shineX, y: shineY })
    })
  }

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setTilt({ x: 0, y: 0 })
    setShine({ x: 50, y: 50 })
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 카드 본체 */}
      <div className="relative rounded-lg overflow-hidden shadow-2xl cursor-pointer">
        {/* Shine (스팟 하이라이트) - 성능 최적화 */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-20 rounded-lg"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,${0.6 * intensity}) 0%, transparent 40%)`,
            transition: shine.x === 50 && shine.y === 50 ? "background 0.4s ease-out" : "none",
          }}
        />

        {/* 추가 글로우 (부드러운 색 번짐) - 성능 최적화 */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none z-20 rounded-lg"
          style={{
            background: `linear-gradient(45deg, transparent 35%, ${effectColor}15 50%, transparent 65%)`,
            transform: `translateX(${(shine.x - 50) / 3}px) translateY(${(shine.y - 50) / 3}px)`,
            transition: shine.x === 50 && shine.y === 50 ? "transform 0.4s ease-out" : "none",
          }}
        />

        {children}
      </div>
    </div>
  )
}