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
}

export function CardStack({ photos, emotion, emotionColor }: CardStackProps) {
  // 카드 순서 상태 (맨 앞이 0번 인덱스)
  const [cardOrder, setCardOrder] = useState<number[]>(() => 
    photos.map((_, index) => index)
  )
  
  
  // 최대 표시할 카드 수 (성능 최적화)
  const MAX_VISIBLE_CARDS = 4
  
  // 현재 표시할 카드들 (앞의 4장만)
  const visibleCards = cardOrder.slice(0, MAX_VISIBLE_CARDS)
  
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
  
  // 카드 클릭 핸들러 - 맨 앞 카드를 맨 뒤로 이동
  const handleCardClick = (stackIndex: number) => {
    // 맨 앞 카드만 클릭 가능
    if (stackIndex !== 0) return
    
    // 맨 앞 카드를 맨 뒤로 이동
    const newOrder = [...cardOrder]
    const frontCard = newOrder.shift() // 맨 앞 카드 제거
    if (frontCard !== undefined) {
      newOrder.push(frontCard) // 맨 뒤에 추가
    }
    
    setCardOrder(newOrder)
  }
  
  // 썸네일 선택 핸들러 - 선택된 사진을 맨 앞으로 이동 (부드럽게)
  const handleThumbnailSelect = (targetIndex: number) => {
    // 현재 맨 앞에 있는 사진의 원본 인덱스
    const currentFrontIndex = cardOrder[0]
    
    if (currentFrontIndex === targetIndex) return // 이미 앞에 있음
    
    // 새로운 순서 계산: 선택된 사진을 맨 앞으로
    const newOrder = [...cardOrder]
    const targetPosition = newOrder.indexOf(targetIndex)
    
    if (targetPosition !== -1) {
      // 선택된 카드를 배열에서 제거하고 맨 앞에 추가
      newOrder.splice(targetPosition, 1)
      newOrder.unshift(targetIndex)
      setCardOrder(newOrder)
    }
  }
  
  // 현재 맨 앞 사진의 인덱스 (썸네일 네비게이션용)
  const currentPhotoIndex = cardOrder[0] || 0
  
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
                  isTopCard ? 'cursor-pointer' : 'cursor-default'
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
                  className="w-52 h-72 md:w-56 md:h-80 rounded-xl overflow-hidden shadow-xl border-2"
                  style={{ borderColor: emotionColor }}
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
        
        {/* 썸네일 네비게이션 */}
        <ThumbnailNavigation
          photos={photos}
          currentPhotoIndex={currentPhotoIndex}
          onPhotoSelect={handleThumbnailSelect}
          emotionColor={emotionColor}
          emotion={emotion}
        />
      </div>
    </div>
  )
}