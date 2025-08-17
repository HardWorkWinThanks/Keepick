"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { HighlightPhoto } from "@/entities/highlight"

interface GridViewProps {
  photos: HighlightPhoto[]
  emotion: string
  emotionColor: string
  onPhotoClick?: (photoId: number, photoUrl: string) => void
  isSelectingCoverImage?: boolean
}

export function GridView({ photos, emotion, emotionColor, onPhotoClick, isSelectingCoverImage }: GridViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<HighlightPhoto | null>(null)
  
  // 사진 클릭 핸들러
  const handlePhotoClick = (photo: HighlightPhoto) => {
    if (isSelectingCoverImage && onPhotoClick) {
      onPhotoClick(photo.photoId, photo.photoUrl)
    } else {
      setSelectedPhoto(photo)
    }
  }
  
  // 모달 닫기
  const closeModal = () => {
    setSelectedPhoto(null)
  }
  
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white">
        <p>사진이 없습니다</p>
      </div>
    )
  }
  
  // 사진 개수에 따른 그리드 클래스 결정
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1"
    if (count === 2) return "grid-cols-2"
    if (count <= 4) return "grid-cols-2"
    if (count <= 6) return "grid-cols-3"
    return "grid-cols-3 md:grid-cols-4"
  }
  
  // 그리드 아이템 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  // 각 아이템별 고유한 애니메이션 생성
  const getItemVariants = (index: number) => ({
    hidden: { 
      scale: 0.8,
      opacity: 0,
      rotate: (index % 4) * 5 - 10, // 인덱스 기반 회전
      x: ((index % 3) - 1) * 30, // 인덱스 기반 X 위치
      y: (Math.floor(index / 3) % 2) * 20 - 10  // 인덱스 기반 Y 위치
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      x: 0,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        duration: 0.6
      }
    }
  })

  return (
    <>
      {/* 그리드 뷰 */}
      <motion.div 
        className="w-full h-full flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className={`grid gap-2 md:gap-3 ${getGridClass(photos.length)} max-w-2xl`}
          variants={containerVariants}
        >
          {photos.map((photo, index) => (
            <motion.button
              key={photo.photoId}
              variants={getItemVariants(index)}
              onClick={() => handlePhotoClick(photo)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 hover:shadow-lg ${
                isSelectingCoverImage 
                  ? 'hover:ring-4 hover:ring-white/50 cursor-pointer' 
                  : ''
              }`}
              style={{ borderColor: isSelectingCoverImage ? '#FE7A25' : emotionColor }}
              whileHover={{ 
                scale: isSelectingCoverImage ? 1.1 : 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.95,
                transition: { duration: 0.1 }
              }}
            >
              <Image
                src={photo.photoUrl || "/placeholder.svg"}
                alt={`${emotion} 사진 ${index + 1}`}
                width={200}
                height={200}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 150px, 200px"
              />
              
              {/* 호버 시 오버레이 */}
              <motion.div 
                className="absolute inset-0 bg-black/0 flex items-center justify-center"
                whileHover={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-white font-medium text-sm bg-black/50 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                </motion.div>
              </motion.div>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
      
      {/* 선택된 사진 모달 */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="relative max-w-4xl max-h-4xl p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={closeModal}
                className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
              <Image
                src={selectedPhoto.photoUrl || "/placeholder.svg"}
                alt={`${emotion} 사진 상세보기`}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}