"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { HighlightPhoto } from "@/entities/highlight"
import { ThumbnailNavigation } from "./ThumbnailNavigation"

interface CardStackProps {
  photos: HighlightPhoto[]
  emotion: string
  emotionColor: string
  hideNavigation?: boolean
  onPhotoClick?: (photoId: number, photoUrl: string) => void
  isSelectingCoverImage?: boolean
}

export function CardStack({ photos, emotion, emotionColor, hideNavigation = false, onPhotoClick, isSelectingCoverImage }: CardStackProps) {
  // 현재 보여주는 사진의 시작 인덱스 (원본 배열 기준)
  const [currentStartIndex, setCurrentStartIndex] = useState(0)
  
  // 고정된 카드 순서 (항상 원본 순서 유지)
  const cardOrder = photos.map((_, index) => index)
  
  
  // 최대 표시할 카드 수 (성능 최적화)
  const MAX_VISIBLE_CARDS = 4
  
  // 현재 시작 인덱스부터 순환하여 표시할 카드들
  const visibleCards = Array.from({ length: Math.min(MAX_VISIBLE_CARDS, photos.length) }, (_, i) => {
    return (currentStartIndex + i) % photos.length
  })
  
  // 카드 스타일 계산 - 21.png 스타일 부채꼴 형태
  const getCardStyle = (index: number) => {
    const totalCards = Math.min(visibleCards.length, MAX_VISIBLE_CARDS)
    
    // 21.png처럼 부채꼴 형태로 겹쳐진 배치
    const fanSpread = 35 // 카드 간 간격을 늘려서 더 펼쳐지게
    const rotationSpread = 12 // 회전 각도를 크게 해서 부채꼴 느낌
    const depthOffset = 8 // 깊이감을 위한 Y 오프셋
    
    // 중심 기준으로 대칭 배치 (21.png 스타일)
    const centerIndex = (totalCards - 1) / 2
    const relativeIndex = index - centerIndex
    
    // 21.png처럼 카드들이 약간 겹치면서도 각각 보이게
    const offsetX = relativeIndex * fanSpread
    const offsetY = Math.abs(relativeIndex) * depthOffset // 바깥쪽 카드들이 뒤로
    const rotation = relativeIndex * rotationSpread
    
    // 21.png처럼 모든 카드가 충분히 보이게 투명도 조정
    const scale = 1 - (Math.abs(relativeIndex) * 0.03)
    const opacity = 1 - (Math.abs(relativeIndex) * 0.05) // 투명도 차이를 줄여서 뒤 카드도 잘 보이게
    
    return {
      scale,
      rotate: rotation,
      x: offsetX,
      y: offsetY,
      opacity: Math.max(opacity, 0.85), // 최소 투명도를 높여서 뒤 카드도 선명하게
      zIndex: MAX_VISIBLE_CARDS - index // 첫 번째 카드(index=0)가 가장 위에
    }
  }
  
  // 카드 클릭 핸들러 - 대표이미지 선택 모드 또는 일반 네비게이션
  const handleCardClick = (stackIndex: number) => {
    const cardIndex = visibleCards[stackIndex]
    const photo = photos[cardIndex]
    
    if (isSelectingCoverImage && onPhotoClick && photo) {
      // 대표이미지 선택 모드: 어떤 카드든 클릭 가능
      onPhotoClick(photo.photoId, photo.photoUrl)
    } else {
      // 일반 모드: 맨 앞 카드만 클릭 가능
      if (stackIndex !== 0) return
      // 다음 사진으로 이동 (순환)
      setCurrentStartIndex((prev) => (prev + 1) % photos.length)
    }
  }
  
  // 썸네일 선택 핸들러 - 해당 사진이 맨 앞에 오도록 시작 인덱스 변경
  const handleThumbnailSelect = (targetIndex: number) => {
    if (currentStartIndex === targetIndex) return // 이미 앞에 있음
    
    // 선택된 사진이 맨 앞에 오도록 시작 인덱스 변경
    setCurrentStartIndex(targetIndex)
  }
  
  // 현재 맨 앞 사진의 인덱스 (썸네일 네비게이션용)
  const currentPhotoIndex = currentStartIndex
  
  // 카드가 없으면 빈 상태 표시
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <p>사진이 없습니다</p>
      </div>
    )
  }
  
  return (
    <div className="relative">
      {/* 카드 스택 */}
      <div className="relative">
        <AnimatePresence>
          {visibleCards.map((cardIndex, stackIndex) => {
            const photo = photos[cardIndex]
            if (!photo) return null
            
            const style = getCardStyle(stackIndex)
            const isTopCard = stackIndex === 0
            
            return (
              <motion.div
                key={`${emotion}-${cardIndex}`}
                className={`absolute top-0 left-0 ${
                  isSelectingCoverImage 
                    ? 'cursor-pointer hover:scale-105' 
                    : isTopCard ? 'cursor-pointer' : 'cursor-default'
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: style.scale,
                  rotate: style.rotate,
                  x: style.x,
                  y: style.y,
                  opacity: style.opacity
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                style={{ 
                  zIndex: style.zIndex,
                  transformOrigin: 'center center'
                }}
                onClick={() => handleCardClick(stackIndex)}
                whileHover={isTopCard ? { 
                  scale: style.scale * 1.05,
                  transition: { duration: 0.2 }
                } : {}}
                whileTap={isTopCard ? {
                  scale: style.scale * 0.95,
                  transition: { duration: 0.1 }
                } : {}}
              >
                <div 
                  className={`w-52 h-72 md:w-56 md:h-80 rounded-xl overflow-hidden shadow-xl border-2 transition-all duration-300 ${
                    isSelectingCoverImage ? 'hover:ring-4 hover:ring-white/50' : ''
                  }`}
                  style={{ borderColor: isSelectingCoverImage ? '#FE7A25' : emotionColor }}
                >
                  <Image
                    src={photo.photoUrl || "/presentation/surprise_018.jpg"}
                    alt={`${emotion} 사진 ${cardIndex + 1}`}
                    width={224}
                    height={320}
                    className="w-full h-full object-cover"
                    draggable={false}
                    priority={stackIndex < 2} // 앞의 2장만 priority 로딩
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* 썸네일 네비게이션 - hideNavigation이 true면 숨김 */}
        {!hideNavigation && (
          <ThumbnailNavigation
            photos={photos}
            currentPhotoIndex={currentPhotoIndex}
            onPhotoSelect={handleThumbnailSelect}
            emotionColor={emotionColor}
            emotion={emotion}
          />
        )}
      </div>
    </div>
  )
}