"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { DraggablePhotoGrid, PhotoDropZone } from "@/features/photo-drag-drop"
import type { Photo, DragPhotoData } from "@/entities/photo"
import Image from "next/image"

// 앨범 정보 편집 타입 (범용)
export interface EditingAlbumInfo {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
}

interface AlbumEditingSidebarProps {
  // 공통
  isOpen: boolean
  onClose: () => void
  availablePhotos: Photo[]
  draggingPhotoId: number | null
  onDragStart: (e: React.DragEvent<HTMLDivElement>, photo: Photo) => void
  onDragEnd: () => void
  onDrop: (dragData: DragPhotoData) => void
  
  // 앨범 정보 편집
  albumInfo: EditingAlbumInfo | null
  onAlbumInfoUpdate: (updates: Partial<EditingAlbumInfo>) => void
  titleInputRef?: React.RefObject<HTMLInputElement | null>
  
  // 대표이미지
  coverImage: Photo | null
  onCoverImageDrop: (dragData: DragPhotoData) => void
  onCoverImageRemove?: (dragData: DragPhotoData) => void
  
  // 조건부 기능
  showDateInputs?: boolean  // 타임라인=true, 티어=false
  
  // 사용방법 안내 커스터마이징
  title?: string
  description?: string
  instructions?: string[]
  
  // 사진 추가/삭제 기능 (새로 추가)
  onAddPhotos?: () => void
  onDeletePhotos?: (photoIds: number[]) => void
  albumType?: 'timeline' | 'tier'
  groupId?: string
  albumId?: string
}

export function AlbumEditingSidebar({ 
  isOpen, 
  onClose, 
  availablePhotos,
  draggingPhotoId,
  onDragStart,
  onDragEnd,
  onDrop,
  albumInfo,
  onAlbumInfoUpdate,
  titleInputRef,
  coverImage,
  onCoverImageDrop,
  onCoverImageRemove,
  showDateInputs = true,
  title = "앨범 수정",
  description = "앨범 정보와 사진을 수정하세요.",
  instructions = [
    "사진을 드래그해서 타임라인 섹션으로 이동",
    "각 섹션에 최대 3장까지 추가 가능", 
    "드롯하면 자동으로 레이아웃 적용"
  ],
  onAddPhotos,
  onDeletePhotos,
  albumType,
  groupId,
  albumId
}: AlbumEditingSidebarProps) {
  const [isAlbumInfoExpanded, setIsAlbumInfoExpanded] = useState(false) // 기본값을 false로 설정
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]) // 삭제를 위한 사진 선택
  const [isDeleteMode, setIsDeleteMode] = useState(false) // 삭제 모드

  // albumInfo가 변경될 때마다 드롭다운 상태를 업데이트
  useEffect(() => {
    // 앨범 제목이 없거나 비어있으면 드롭다운 열림, 있으면 닫힘
    setIsAlbumInfoExpanded(!albumInfo?.name || albumInfo.name.trim() === '')
  }, [albumInfo?.name])

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
              <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm text-gray-400 mb-4">{description}</p>
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

                  {/* 날짜 범위 - 조건부 렌더링 */}
                  {showDateInputs && (
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
                  )}

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

                  {/* 대표 이미지 안내 - 티어 앨범용 조건부 렌더링 */}
                  {!showDateInputs && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">대표 이미지</label>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-blue-300 font-keepick-primary text-xs font-medium">
                            S티어 1위가 앨범 대표이미지가 됩니다!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 대표 이미지 섹션 - 타임라인 앨범용 */}
                  {showDateInputs && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-3 block">대표 이미지</label>
                      <PhotoDropZone
                        onDrop={(dragData, e) => onCoverImageDrop(dragData)}
                        dropZoneId="cover-image-drop"
                        className="relative w-full aspect-[4/3] bg-[#333333]/50 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden hover:border-[#FE7A25] transition-colors"
                        // 대표이미지를 드래그 가능하게 만들기
                        draggable={!!coverImage}
                        onDragStart={(e) => {
                          if (coverImage) {
                            const dragData: DragPhotoData = {
                              photoId: coverImage.id,
                              source: 'cover-image',
                              originalUrl: coverImage.originalUrl,
                              thumbnailUrl: coverImage.thumbnailUrl,
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
                              src={coverImage.originalUrl || "/placeholder/photo-placeholder.svg"}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">갤러리에서 선택한 사진</h3>
                <span className="text-sm text-gray-400">{availablePhotos.length}장</span>
              </div>
              
              {/* 사진 추가/삭제 버튼들 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 갤러리에서 사진 추가 버튼 */}
                {onAddPhotos && (
                  <button
                    onClick={onAddPhotos}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-800/50 border border-gray-600/30 rounded text-white hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-400 transition-colors text-xs font-medium"
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
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-800/50 border border-gray-600/30 rounded text-white hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-colors text-xs font-medium"
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
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-500/10 border border-gray-500/20 rounded text-gray-400 hover:bg-gray-500/20 hover:border-gray-500/40 transition-colors text-xs font-medium"
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
            </div>
            
            <PhotoDropZone
              onDrop={onDrop}
              dropZoneId="sidebar-photos-grid"
              className="min-h-[300px] max-h-[400px] rounded-lg transition-colors border-2 border-transparent hover:border-[#FE7A25]/20 data-[drag-over=true]:border-[#FE7A25]/50 data-[drag-over=true]:bg-[#FE7A25]/5"
            >
              <ScrollArea className="h-full max-h-[400px]">
                {availablePhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 pr-2">
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
                {instructions.map((instruction, index) => (
                  <li key={index}>• {instruction}</li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}