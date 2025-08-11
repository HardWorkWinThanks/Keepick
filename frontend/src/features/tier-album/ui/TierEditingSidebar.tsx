"use client"

import { useState } from "react"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { DraggablePhotoGrid } from "@/features/photo-drag-drop"
import type { Photo } from "@/entities/photo"

interface TierEditingSidebarProps {
  isOpen: boolean
  onClose: () => void
  availablePhotos: Photo[]
}

export function TierEditingSidebar({ 
  isOpen, 
  onClose, 
  availablePhotos
}: TierEditingSidebarProps) {
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
          top: '80px', // 헤더 아래부터 시작
          height: 'calc(100vh - 80px)', // 헤더 높이만큼 제외
          transitionDuration: isOpen ? '0.4s' : '0.3s',
          transitionDelay: isOpen ? '0.1s' : '0s',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Photos Grid */}
          <div className="flex-1 flex flex-col px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">사용 가능한 사진</h3>
              <span className="text-xs text-gray-500">{availablePhotos.length}장</span>
            </div>
            
            <ScrollArea className="flex-1">
              <DraggablePhotoGrid
                photos={availablePhotos}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                draggingPhotoId={draggingPhotoId}
                sourceId="available"
                gridClassName="grid grid-cols-3 gap-3 pr-2"
                photoClassName="w-full h-auto object-cover rounded-md shadow-sm aspect-square hover:scale-105 transition-transform cursor-grab"
              />
            </ScrollArea>
          </div>

          {/* Instructions - Fixed at bottom */}
          <div className="p-6 pt-0">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">사용 방법</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 사진을 드래그해서 티어 그리드로 이동</li>
                <li>• S, A, B, C, D 티어에 원하는 사진 배치</li>
                <li>• 정밀 배틀 모드로 정확한 순위 결정</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}