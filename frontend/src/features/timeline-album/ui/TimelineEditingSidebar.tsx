"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { DraggablePhotoGrid, PhotoDropZone } from "@/features/photo-drag-drop"
import type { Photo, DragPhotoData } from "@/entities/photo"
import { EditingAlbumInfo } from "../model/useTimelineEditor"
import Image from "next/image"

interface TimelineEditingSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCoverImageDrop?: (dragData: DragPhotoData) => void
  onSectionPhotoRemove?: (dragData: DragPhotoData) => void // 섹션에서 사진 제거
  onCoverImageRemove?: (dragData: DragPhotoData) => void // 대표이미지에서 사진 제거
  // 하이브리드 방식으로 데이터 props로 전달
  availablePhotos: Photo[]
  coverImage: Photo | null
  // 앨범 정보 인라인 편집
  albumInfo: EditingAlbumInfo | null
  onAlbumInfoUpdate: (updates: Partial<EditingAlbumInfo>) => void
  titleInputRef?: React.RefObject<HTMLInputElement | null>
}

export function TimelineEditingSidebar({ 
  isOpen, 
  onClose, 
  onCoverImageDrop,
  onSectionPhotoRemove,
  onCoverImageRemove,
  availablePhotos,
  coverImage,
  albumInfo,
  onAlbumInfoUpdate,
  titleInputRef
}: TimelineEditingSidebarProps) {
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null)
  const [isAlbumInfoExpanded, setIsAlbumInfoExpanded] = useState(true) // 앨범 정보 드롭다운 상태

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
        <ScrollArea className="h-full [&>div>div[data-radix-scroll-area-viewport]]:!pr-3"
          style={{
            '--scrollbar-thumb': 'rgba(254, 122, 37, 0.3)',
            '--scrollbar-track': 'rgba(34, 34, 34, 0.5)'
          } as React.CSSProperties}
        >
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">앨범 수정</h2>
              <p className="text-sm text-gray-400 mb-4">앨범 정보와 사진을 수정하세요.</p>
            </div>

            {/* Album Info Dropdown */}
            <div className="mb-6">
              {/* 드롭다운 헤더 */}
              <button
                onClick={() => setIsAlbumInfoExpanded(!isAlbumInfoExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <h3 className="text-base font-semibold text-white">앨범 정보</h3>
                {isAlbumInfoExpanded ? (
                  <ChevronUp size={18} className="text-gray-300" />
                ) : (
                  <ChevronDown size={18} className="text-gray-300" />
                )}
              </button>

              {/* 드롭다운 콘텐츠 */}
              <motion.div
                initial={false}
                animate={{
                  height: isAlbumInfoExpanded ? "auto" : 0,
                  opacity: isAlbumInfoExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="pt-4 space-y-4">
                  {/* 앨범 제목 */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">앨범 제목 (필수)</label>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={albumInfo?.name || ''}
                      onChange={(e) => onAlbumInfoUpdate({ name: e.target.value })}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#FE7A25]/30 focus:border-[#FE7A25] focus:outline-none transition-colors"
                      placeholder="앨범 제목을 입력하세요"
                    />
                    {(!albumInfo?.name || albumInfo.name.trim() === '') && (
                      <p className="text-red-400 text-xs mt-1">제목을 입력해주세요</p>
                    )}
                  </div>

                  {/* 날짜 범위 */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">날짜 범위</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={albumInfo?.startDate || ''}
                        onChange={(e) => onAlbumInfoUpdate({ startDate: e.target.value })}
                        className="bg-gray-800 text-gray-300 px-2 py-2 rounded border border-[#FE7A25]/30 focus:border-[#FE7A25] focus:outline-none text-sm [color-scheme:dark]"
                      />
                      <input
                        type="date"
                        value={albumInfo?.endDate || ''}
                        onChange={(e) => onAlbumInfoUpdate({ endDate: e.target.value })}
                        className="bg-gray-800 text-gray-300 px-2 py-2 rounded border border-[#FE7A25]/30 focus:border-[#FE7A25] focus:outline-none text-sm [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* 앨범 설명 */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">앨범 설명</label>
                    <textarea
                      value={albumInfo?.description || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) {
                          onAlbumInfoUpdate({ description: e.target.value })
                        }
                      }}
                      className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-[#FE7A25]/30 focus:border-[#FE7A25] focus:outline-none resize-none"
                      rows={2}
                      placeholder="앨범 설명을 작성해주세요 (최대 30자)"
                      maxLength={30}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {(albumInfo?.description || '').length}/30자
                      </span>
                      {(albumInfo?.description || '').length > 25 && (
                        <span className="text-xs text-orange-400">
                          {30 - (albumInfo?.description || '').length}자 남음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 대표 이미지 섹션 */}
                  {(onCoverImageDrop || coverImage) && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-3 block">대표 이미지</label>
                      <PhotoDropZone
                        onDrop={(dragData, e) => onCoverImageDrop?.(dragData)}
                        dropZoneId="cover-image-drop"
                        className="relative w-full aspect-[4/3] bg-[#333333]/50 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden hover:border-[#FE7A25] transition-colors"
                        // 대표이미지를 드래그 가능하게 만들기
                        draggable={!!coverImage}
                        onDragStart={(e) => {
                          if (coverImage) {
                            const dragData: DragPhotoData = {
                              photoId: coverImage.id,
                              source: 'cover-image',
                              src: coverImage.src,
                              thumbnailUrl: coverImage.thumbnailUrl,
                              originalUrl: coverImage.originalUrl,
                              name: coverImage.name
                            }
                            e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
                            e.dataTransfer.effectAllowed = 'move'
                            console.log('🖼️ 대표이미지 드래그 시작:', dragData)
                          }
                        }}
                      >
                        {coverImage ? (
                          <div className="relative w-full h-full group">
                            <Image
                              src={coverImage.originalUrl || coverImage.src || "/placeholder/photo-placeholder.svg"}
                              alt="대표 이미지"
                              fill
                              sizes="280px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src="/placeholder/photo-placeholder.svg"
                              alt="대표 이미지 없음"
                              width={60}
                              height={60}
                              className="opacity-40"
                            />
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center text-gray-400">
                              <div className="font-keepick-primary text-xs">
                                대표 이미지 선택
                              </div>
                            </div>
                          </div>
                        )}
                      </PhotoDropZone>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

          </div>

          {/* Photos Grid - 전체 영역을 드롭존으로 */}
          <div className="flex flex-col px-6 pb-6">
            <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">갤러리에서 선택한 사진</h3>
                <span className="text-sm text-gray-400">{availablePhotos.length}장</span>
              </div>
            </div>
            
            <PhotoDropZone
              onDrop={(dragData, e) => {
                // 섹션에서 온 사진 또는 대표이미지에서 온 사진 처리
                if (dragData.source.startsWith('section-')) {
                  onSectionPhotoRemove?.(dragData)
                } else if (dragData.source === 'cover-image') {
                  onCoverImageRemove?.(dragData)
                }
              }}
              dropZoneId="sidebar-photos-grid"
              className="min-h-[300px] max-h-[400px] rounded-lg transition-colors border-2 border-transparent hover:border-[#FE7A25]/20 data-[drag-over=true]:border-[#FE7A25]/50 data-[drag-over=true]:bg-[#FE7A25]/5"
            >
              <ScrollArea className="h-full max-h-[400px]">
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
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="font-keepick-primary text-sm">
                        사용 가능한 사진이 없습니다
                      </div>
                      <div className="font-keepick-primary text-xs mt-2 text-gray-600">
                        섹션에서 사진을 여기로 드래그하세요
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </PhotoDropZone>
          </div>

          {/* Instructions */}
          <div className="px-6 pt-6 pb-6">
            <div className="p-4 bg-gray-800/50 rounded-lg">
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