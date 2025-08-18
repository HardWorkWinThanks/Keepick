"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Photo } from "@/entities/photo"

interface AlbumInfoModalProps {
  isOpen: boolean
  onClose: () => void
  albumInfo: {
    title: string
    startDate: string
    endDate: string
    description: string
    coverImage?: Photo | null
  }
  onSave: (albumInfo: {
    title: string
    startDate: string
    endDate: string
    description: string
    coverImage?: Photo | null
  }) => void
  onCoverImageSelect?: (photo: Photo) => void
  isSelectingCoverImage?: boolean
  onToggleCoverImageSelection?: () => void
}

export function AlbumInfoModal({
  isOpen,
  onClose,
  albumInfo,
  onSave,
  onCoverImageSelect,
  isSelectingCoverImage,
  onToggleCoverImageSelection
}: AlbumInfoModalProps) {
  // 모달 내부 로컬 상태
  const [localAlbumInfo, setLocalAlbumInfo] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    coverImage: null as Photo | null
  })

  // 모달이 열릴 때 외부 데이터로 초기화
  useEffect(() => {
    if (isOpen) {
      setLocalAlbumInfo({
        title: albumInfo.title || '',
        startDate: albumInfo.startDate || '',
        endDate: albumInfo.endDate || '',
        description: albumInfo.description || '',
        coverImage: albumInfo.coverImage || null
      })
    }
  }, [isOpen, albumInfo])

  const handleLocalChange = (field: string, value: string | Photo | null) => {
    setLocalAlbumInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    onSave(localAlbumInfo)
    onClose()
  }
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 transition-opacity duration-300 bg-opacity-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0
              }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#111111] border border-gray-700 rounded-lg shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">앨범 정보</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">

                {/* Album Title */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">앨범 제목</p>
                  <input
                    type="text"
                    value={localAlbumInfo.title}
                    onChange={(e) => handleLocalChange('title', e.target.value)}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none"
                    placeholder="앨범 제목을 입력하세요"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">시작 날짜</p>
                    <input
                      type="date"
                      value={localAlbumInfo.startDate}
                      onChange={(e) => handleLocalChange('startDate', e.target.value)}
                      className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">끝 날짜</p>
                    <input
                      type="date"
                      value={localAlbumInfo.endDate}
                      onChange={(e) => handleLocalChange('endDate', e.target.value)}
                      className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Album Description */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">앨범 설명</p>
                  <textarea
                    value={localAlbumInfo.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        handleLocalChange('description', e.target.value)
                      }
                    }}
                    className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="앨범 설명을 작성해주세요 (최대 100자)"
                    maxLength={100}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {localAlbumInfo.description.length}/100자
                    </span>
                    {localAlbumInfo.description.length > 80 && (
                      <span className="text-xs text-orange-400">
                        {100 - localAlbumInfo.description.length}자 남음
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
                <button
                  onClick={onClose}
                  className="group relative px-4 py-2 text-gray-400 hover:text-white transition-all duration-300 hover:bg-gray-800 rounded-lg"
                >
                  <span className="relative">취소</span>
                </button>
                <button
                  onClick={handleSave}
                  className="group relative p-px rounded-lg overflow-hidden bg-gray-700 text-white transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600"
                >
                  <div className="bg-[#111111] rounded-[7px] px-5 py-2">
                    <span className="relative">저장</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}