"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { DraggablePhotoGrid, PhotoDropZone } from "@/features/photo-drag-drop"
import type { Photo, DragPhotoData } from "@/entities/photo"
import Image from "next/image"

interface TimelineEditingSidebarProps {
  isOpen: boolean
  onClose: () => void
  onShowAlbumInfoModal: () => void
  onCoverImageDrop?: (dragData: DragPhotoData) => void
  onSectionPhotoRemove?: (dragData: DragPhotoData) => void // 섹션에서 사진 제거
  // 하이브리드 방식으로 데이터 props로 전달
  availablePhotos: Photo[]
  coverImage: Photo | null
}

export function TimelineEditingSidebar({ 
  isOpen, 
  onClose, 
  onShowAlbumInfoModal,
  onCoverImageDrop,
  onSectionPhotoRemove,
  availablePhotos,
  coverImage
}: TimelineEditingSidebarProps) {
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null)

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
        <div className="h-full flex flex-col">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">앨범 수정</h2>
              <p className="text-sm text-gray-400 mb-4">앨범 정보와 사진을 수정하세요.</p>
              
              {/* Album Info Button */}
              <button
                onClick={onShowAlbumInfoModal}
                className="group relative w-full p-px rounded-xl overflow-hidden bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:bg-gradient-to-r hover:from-[#FE7A25] hover:to-[#FF6B35]"
              >
                <div className="bg-[#111111] rounded-[11px] px-4 py-3">
                  <div className="relative flex items-center justify-center gap-2 text-white">
                    <span className="text-sm font-keepick-primary tracking-wider">앨범 정보 변경</span>
                  </div>
                </div>
              </button>
            </div>

            {/* 대표 이미지 섹션 */}
            {(onCoverImageDrop || coverImage) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">대표 이미지</h3>
                <PhotoDropZone
                  onDrop={(dragData, e) => onCoverImageDrop?.(dragData)}
                  dropZoneId="cover-image-drop"
                  className="relative w-full aspect-[4/3] bg-[#333333]/50 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden hover:border-[#FE7A25] transition-colors"
                >
                  {coverImage ? (
                    <Image
                      src={coverImage.originalUrl || coverImage.src || "/placeholder/photo-placeholder.svg"}
                      alt="대표 이미지"
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="text-xl mb-1">📷</div>
                        <div className="font-keepick-primary text-xs">
                          대표 이미지 선택
                        </div>
                      </div>
                    </div>
                  )}
                </PhotoDropZone>
              </div>
            )}

            {/* 섹션에서 제거할 사진 드롭존 */}
            {onSectionPhotoRemove && (
              <div className="mb-6">
                <PhotoDropZone
                  onDrop={(dragData, e) => onSectionPhotoRemove?.(dragData)}
                  dropZoneId="sidebar-photos-return"
                  className="min-h-[50px] border-2 border-dashed border-gray-600/50 rounded-lg p-3 hover:border-[#FE7A25]/50 transition-colors"
                >
                  <div className="text-center text-gray-500 font-keepick-primary text-xs">
                    섹션에서 사진을 여기로 드래그하여 제거
                  </div>
                </PhotoDropZone>
              </div>
            )}
          </div>

          {/* Photos Grid */}
          <div className="flex-1 flex flex-col px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">선택된 사진</h3>
              <span className="text-xs text-gray-500">{availablePhotos.length}장</span>
            </div>
            
            <ScrollArea className="flex-1">
              {availablePhotos.length > 0 ? (
                <DraggablePhotoGrid
                  photos={availablePhotos}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  draggingPhotoId={draggingPhotoId}
                  sourceId="gallery"
                  gridClassName="grid grid-cols-3 gap-3 pr-2"
                  photoClassName="w-full h-auto object-cover rounded-md shadow-sm aspect-square hover:scale-105 transition-transform cursor-grab"
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📸</div>
                  <div className="font-keepick-primary text-sm">
                    사용 가능한 사진이 없습니다
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Instructions - Fixed at bottom */}
          <div className="p-6 pt-0">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">사용 방법</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 사진을 드래그해서 타임라인 섹션으로 이동</li>
                <li>• 각 섹션에 최대 3장까지 추가 가능</li>
                <li>• 드롭하면 자동으로 레이아웃 적용</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}