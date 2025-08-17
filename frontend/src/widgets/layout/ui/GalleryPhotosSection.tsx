'use client'

import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/shared/ui/shadcn/scroll-area'
import { PhotoDropZone } from '@/features/photo-drag-drop'
import type { Photo, DragPhotoData } from '@/entities/photo'
import Image from 'next/image'

interface GalleryPhotosSectionProps {
  // 공통 기능
  availablePhotos: Photo[]
  draggingPhotoId: number | null
  onDragStart: (e: React.DragEvent<HTMLDivElement>, photo: Photo) => void
  onDragEnd: () => void
  onDrop: (dragData: DragPhotoData) => void
  
  // 사진 추가/삭제 기능
  onAddPhotos?: () => void
  onDeletePhotos?: (photoIds: number[]) => void
  
  // 커스터마이징
  title?: string
  showControls?: boolean
}

export function GalleryPhotosSection({ 
  availablePhotos,
  draggingPhotoId,
  onDragStart,
  onDragEnd,
  onDrop,
  onAddPhotos,
  onDeletePhotos,
  title = "갤러리에서 선택한 사진",
  showControls = true
}: GalleryPhotosSectionProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]) // 삭제를 위한 사진 선택
  const [isDeleteMode, setIsDeleteMode] = useState(false) // 삭제 모드


  return (
    <div className="p-4 border-b border-gray-800">
      {/* 사진 그리드 - 고정 크기 */}
      <div className="h-[300px] relative">
        <PhotoDropZone
          onDrop={onDrop}
          dropZoneId="sidebar-photos-grid"
          className="h-full rounded-lg transition-colors border-2 border-transparent hover:border-[#FE7A25]/20 data-[drag-over=true]:border-[#FE7A25]/50 data-[drag-over=true]:bg-[#FE7A25]/5 overflow-hidden"
        >
          <div 
            className="h-full overflow-y-auto px-3"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#FE7A25 rgba(34, 34, 34, 0.5)',
            }}
          >
            <style jsx>{`
              div {
                scrollbar-width: thin;
                scrollbar-color: #FE7A25 rgba(34, 34, 34, 0.5);
              }
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: rgba(34, 34, 34, 0.5);
                border-radius: 6px;
              }
              div::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #FE7A25 0%, #FF6B35 100%);
                border-radius: 6px;
                transition: background 0.2s ease;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #FF8A35 0%, #FF7B45 100%);
              }
            `}</style>
            {availablePhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 py-2">
                {availablePhotos.map((photo) => {
                const isSelected = selectedPhotos.includes(photo.id)
                return (
                  <div key={photo.id} className="relative">
                    <div
                      className={`relative w-full aspect-square rounded-md overflow-hidden cursor-grab transition-all duration-200 ${
                        isDeleteMode 
                          ? isSelected
                            ? "ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900 scale-95"
                            : "hover:ring-2 hover:ring-red-300 hover:ring-offset-1 hover:ring-offset-gray-900"
                          : "hover:scale-105"
                      }`}
                      draggable={!isDeleteMode}
                      onDragStart={(e) => {
                        if (!isDeleteMode) {
                          onDragStart(e, photo)
                        } else {
                          e.preventDefault()
                        }
                      }}
                      onDragEnd={() => {
                        if (!isDeleteMode) {
                          onDragEnd()
                        }
                      }}
                      onClick={() => {
                        if (isDeleteMode) {
                          setSelectedPhotos(prev => 
                            prev.includes(photo.id)
                              ? prev.filter(id => id !== photo.id)
                              : [...prev, photo.id]
                          )
                        }
                      }}
                      style={{
                        opacity: draggingPhotoId === photo.id ? 0.5 : 1,
                        cursor: isDeleteMode ? "pointer" : "grab"
                      }}
                    >
                      <Image
                        src={photo.thumbnailUrl || "/placeholder/photo-placeholder.svg"}
                        alt={photo.name || `Photo ${photo.id}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        draggable={false}
                        priority={false}
                        loading="lazy"
                        quality={75}
                      />
                      
                      {/* 삭제 모드에서 선택 표시 */}
                      {isDeleteMode && (
                        <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 transition-all ${
                          isSelected
                            ? "bg-red-500 border-red-500"
                            : "bg-gray-800/80 border-gray-400"
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full flex items-center justify-center">
                              <Trash2 size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-sm">
                    사용 가능한 사진이 없습니다
                  </div>
                  <div className="text-xs mt-2 text-gray-600">
                    섹션에서 사진을 여기로 드래그하세요
                  </div>
                </div>
              </div>
            )}
          </div>
        </PhotoDropZone>
      </div>
      
      {/* 헤더 - 사진 그리드 아래로 이동 */}
      <div className="p-4 bg-[#111111] rounded-lg mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <span className="text-sm text-gray-400">{availablePhotos.length}장</span>
        </div>
        
        {/* 사진 추가/삭제 버튼들 */}
        {showControls && (
          <div className="grid grid-cols-2 gap-2">
            {/* 갤러리에서 사진 추가 버튼 */}
            {onAddPhotos && (
              <button
                onClick={onAddPhotos}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-[#111111] border border-gray-600/30 rounded text-white hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-400 transition-colors text-xs font-medium"
              >
                <Plus size={14} />
                추가
              </button>
            )}
            
            {/* 삭제 모드 - 조건부 렌더링 */}
            {onDeletePhotos && availablePhotos.length > 0 && (
              <>
                {!isDeleteMode ? (
                  <button
                    onClick={() => {
                      setIsDeleteMode(true)
                      setSelectedPhotos([])
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-[#111111] border border-gray-600/30 rounded text-white hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-colors text-xs font-medium"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                ) : (
                  <>
                    {/* 취소 버튼 */}
                    <button
                      onClick={() => {
                        setIsDeleteMode(false)
                        setSelectedPhotos([])
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-[#111111] border border-gray-500/20 rounded text-gray-400 hover:bg-gray-500/20 hover:border-gray-500/40 transition-colors text-xs font-medium"
                    >
                      취소
                    </button>
                    
                    {/* 확인 버튼 */}
                    <button
                      onClick={() => {
                        if (onDeletePhotos && selectedPhotos.length > 0) {
                          onDeletePhotos(selectedPhotos)
                          setSelectedPhotos([])
                          setIsDeleteMode(false)
                        }
                      }}
                      disabled={selectedPhotos.length === 0}
                      className={`flex items-center justify-center gap-1 px-3 py-2 border rounded transition-colors text-xs font-medium ${
                        selectedPhotos.length > 0
                          ? "bg-red-600 border-red-500 text-white hover:bg-red-700"
                          : "bg-gray-600/20 border-gray-600/20 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 size={14} />
                      확인
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}