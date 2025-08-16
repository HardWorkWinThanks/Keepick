'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { Button } from '@/shared/ui/shadcn/button'
import { PhotoDropZone } from '@/features/photo-drag-drop'
import type { Photo, DragPhotoData } from '@/entities/photo'
import Image from 'next/image'

// 앨범 정보 편집 타입 (기존과 동일)
export interface EditingAlbumInfo {
  name: string
  description: string
  startDate?: string
  endDate?: string
}

interface AlbumInfoEditModalProps {
  isOpen: boolean
  onClose: () => void
  albumInfo: EditingAlbumInfo | null
  onAlbumInfoUpdate: (updates: Partial<EditingAlbumInfo>) => void
  
  // 대표이미지 관련
  coverImage: Photo | null
  onCoverImageDrop: (dragData: DragPhotoData) => void
  onCoverImageRemove?: (dragData: DragPhotoData) => void
  
  // 조건부 기능
  showDateInputs?: boolean  // 타임라인=true, 티어=false
  
  // 저장/취소 핸들러
  onSave?: () => Promise<void>
  onCancel?: () => void
  
  // 커스터마이징
  title?: string
  albumType?: 'timeline' | 'tier'
}

export function AlbumInfoEditModal({ 
  isOpen, 
  onClose, 
  albumInfo,
  onAlbumInfoUpdate,
  coverImage,
  onCoverImageDrop,
  onCoverImageRemove,
  showDateInputs = true,
  onSave,
  onCancel,
  title = "앨범 정보 수정",
  albumType = 'timeline'
}: AlbumInfoEditModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)

  // 모달이 열릴 때 제목 input에 포커스
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      // 약간의 지연을 두어 모달 애니메이션 완료 후 포커스
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave()
        onClose()
      } catch (error) {
        // 에러는 상위 컴포넌트에서 처리
        console.error('앨범 정보 저장 중 오류:', error)
      }
    } else {
      onClose()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onClose()
  }

  const isFormValid = albumInfo?.name && albumInfo.name.trim() !== ''

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#111111] border border-gray-800 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* 앨범 제목 */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    앨범 제목 (필수)
                  </label>
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
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      날짜 범위
                    </label>
                    <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    앨범 설명
                  </label>
                  <textarea
                    value={albumInfo?.description || ''}
                    onChange={(e) => {
                      if (e.target.value.length <= 30) {
                        onAlbumInfoUpdate({ description: e.target.value })
                      }
                    }}
                    className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-[#FE7A25]/30 focus:border-[#FE7A25] focus:outline-none resize-none"
                    rows={3}
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

                {/* 대표 이미지 섹션 - 타임라인 앨범용 */}
                {showDateInputs && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      대표 이미지
                    </label>
                    <PhotoDropZone
                      onDrop={(dragData, e) => onCoverImageDrop(dragData)}
                      dropZoneId="modal-cover-image-drop"
                      className="relative w-full aspect-[4/3] bg-[#333333]/50 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden hover:border-[#FE7A25] transition-colors"
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
                        }
                      }}
                    >
                      {coverImage ? (
                        <div className="relative w-full h-full group">
                          <Image
                            src={coverImage.originalUrl || "/placeholder/photo-placeholder.svg"}
                            alt="대표 이미지"
                            fill
                            sizes="400px"
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
                            <div className="text-xs">
                              대표 이미지 선택
                            </div>
                          </div>
                        </div>
                      )}
                    </PhotoDropZone>
                  </div>
                )}

                {/* 티어 앨범 대표이미지 안내 */}
                {!showDateInputs && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      대표 이미지
                    </label>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-blue-300 text-xs font-medium">
                          S티어 1위가 앨범 대표이미지가 됩니다!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isFormValid}
                className={`${
                  isFormValid
                    ? 'bg-[#FE7A25] hover:bg-[#FE7A25]/90 text-white'
                    : 'bg-gray-600 cursor-not-allowed text-gray-400'
                }`}
              >
                <Check size={16} className="mr-1" />
                저장
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}