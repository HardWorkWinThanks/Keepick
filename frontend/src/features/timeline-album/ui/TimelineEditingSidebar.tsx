"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { DraggablePhotoGrid, PhotoDropZone } from "@/features/photo-drag-drop"
import type { Photo, DragPhotoData } from "@/entities/photo"

interface TimelineEditingSidebarProps {
  isOpen: boolean
  onClose: () => void
  availablePhotos: Photo[]
}

export function TimelineEditingSidebar({ isOpen, onClose, availablePhotos }: TimelineEditingSidebarProps) {
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
                <span className="text-xs text-gray-500">{availablePhotos.length}장</span>
              </div>
              
              <DraggablePhotoGrid
                photos={availablePhotos}
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