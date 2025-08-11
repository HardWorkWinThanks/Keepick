"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { DraggablePhotoGrid, PhotoDropZone } from "@/features/photo-drag-drop"
import type { Photo, DragPhotoData } from "@/entities/photo"

interface TimelineEditingSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// 더미 데이터 - 갤러리에서 선택한 사진들
const dummyPhotos: Photo[] = [
  { id: "1", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop", name: "산 풍경 1" },
  { id: "2", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop", name: "숲 풍경" },
  { id: "3", src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&h=300&fit=crop", name: "바다 풍경" },
  { id: "4", src: "https://images.unsplash.com/photo-1418489098061-ce87b5dc3aee?w=300&h=300&fit=crop", name: "산 풍경 2" },
  { id: "5", src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=300&h=300&fit=crop", name: "호수 풍경" },
  { id: "6", src: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=300&fit=crop", name: "일출 풍경" },
  { id: "7", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop", name: "구름 풍경" },
  { id: "8", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop", name: "나무 풍경" },
]

export function TimelineEditingSidebar({ isOpen, onClose }: TimelineEditingSidebarProps) {
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null)

  const handleDragStart = (_: React.DragEvent<HTMLDivElement>, photo: Photo) => {
    setDraggingPhotoId(photo.id)
  }

  const handleDragEnd = () => {
    setDraggingPhotoId(null)
  }

  return (
    <>
      {/* Sidebar */}
      <div 
        className={`fixed left-0 z-40 transition-all ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          backgroundColor: '#111111',
          width: '320px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          top: '0',
          height: '100vh',
          transitionDuration: isOpen ? '0.4s' : '0.3s',
          transitionDelay: isOpen ? '0.1s' : '0s',
        }}
      >
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">앨범 수정</h2>
              <p className="text-sm text-gray-400">갤러리에서 선택한 사진들을 드래그해서 타임라인에 추가하세요.</p>
            </div>

            {/* Photos Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">선택된 사진</h3>
                <span className="text-xs text-gray-500">{dummyPhotos.length}장</span>
              </div>
              
              <DraggablePhotoGrid
                photos={dummyPhotos}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                draggingPhotoId={draggingPhotoId}
                sourceId="gallery"
                gridClassName="grid grid-cols-3 gap-3"
                photoClassName="w-full h-auto object-cover rounded-md shadow-sm aspect-square hover:scale-105 transition-transform cursor-grab"
              />
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">사용 방법</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 사진을 드래그해서 타임라인 섹션으로 이동</li>
                <li>• 각 섹션에 최대 3장까지 추가 가능</li>
                <li>• 드롭하면 자동으로 레이아웃 적용</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}