"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import type { HighlightPhoto } from "@/entities/highlight"

interface ThumbnailNavigationProps {
  photos: HighlightPhoto[]
  currentPhotoIndex: number
  onPhotoSelect: (index: number) => void
  emotionColor: string
  emotion: string
}

export function ThumbnailNavigation({ 
  photos, 
  currentPhotoIndex, 
  onPhotoSelect, 
  emotionColor,
  emotion 
}: ThumbnailNavigationProps) {
  
  // 성능 최적화: 3개 이하면 썸네일 네비게이션 숨김
  if (photos.length <= 3) {
    return null
  }

  // 가상화를 위한 표시할 썸네일 범위 계산
  const MAX_VISIBLE_THUMBNAILS = Math.min(7, photos.length) // 실제 사진 개수로 제한
  const startIndex = Math.max(0, currentPhotoIndex - Math.floor(MAX_VISIBLE_THUMBNAILS / 2))
  const endIndex = Math.min(photos.length, startIndex + MAX_VISIBLE_THUMBNAILS)
  const adjustedStartIndex = Math.max(0, endIndex - MAX_VISIBLE_THUMBNAILS)
  
  // 실제 표시할 썸네일들 (가상화)
  const visibleThumbnails = useMemo(() => 
    photos.slice(adjustedStartIndex, endIndex).map((photo, index) => ({
      ...photo,
      originalIndex: adjustedStartIndex + index
    })), 
    [photos, adjustedStartIndex, endIndex]
  )

  return (
    <div className="mx-26 absolute top-96 left-1/2 transform -translate-x-1/2">
      <div className="flex gap-1.5 md:gap-2">
        {/* 왼쪽 더보기 표시 */}
        {adjustedStartIndex > 0 && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs font-medium">...</span>
          </div>
        )}
        
        {/* 썸네일들 */}
        {visibleThumbnails.map((photo) => (
          <button
            key={`${emotion}-${photo.photoId}-${photo.originalIndex}`}
            onClick={() => onPhotoSelect(photo.originalIndex)}
            className={`w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden transition-all duration-300 relative ${
              photo.originalIndex === currentPhotoIndex 
                ? "ring-2 scale-110 shadow-lg" 
                : "opacity-70 hover:opacity-100 hover:scale-105"
            }`}
            style={{
              "--tw-ring-color": photo.originalIndex === currentPhotoIndex ? emotionColor : "transparent",
            } as React.CSSProperties}
          >
            <Image 
              src={photo.photoUrl || "/placeholder.svg"} 
              alt={`${emotion} 사진 ${photo.originalIndex + 1}`} 
              width={40}
              height={40}
              sizes="40px"
              className="w-full h-full object-cover" 
              {...(photo.originalIndex === currentPhotoIndex 
                ? { priority: true } 
                : { loading: "lazy" as const }
              )}
            />
            
            {/* 호버 시 인덱스 표시 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="font-keepick-primary text-xs text-white">
                {photo.originalIndex + 1}
              </span>
            </div>
          </button>
        ))}
        
        {/* 오른쪽 더보기 표시 */}
        {endIndex < photos.length && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs font-medium">...</span>
          </div>
        )}
      </div>
      
      {/* 사진 카운터 */}
      <div className="text-center mt-2">
        <span className="text-xs text-white/70 font-medium">
          {currentPhotoIndex + 1} / {photos.length}
        </span>
      </div>
    </div>
  )
}