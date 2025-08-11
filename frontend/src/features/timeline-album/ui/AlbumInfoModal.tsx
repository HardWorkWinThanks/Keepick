"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Photo } from "@/entities/photo"

interface AlbumInfoModalProps {
  isOpen: boolean
  onClose: () => void
  albumInfo: {
    title: string
    startDate: string
    endDate: string
    description: string
    coverImage: Photo | null
  }
  onAlbumInfoChange: (field: string, value: string | Photo | null) => void
  onCoverImageSelect: (photo: Photo) => void
  isSelectingCoverImage: boolean
  onToggleCoverImageSelection: () => void
}

export function AlbumInfoModal({
  isOpen,
  onClose,
  albumInfo,
  onAlbumInfoChange,
  onCoverImageSelect,
  isSelectingCoverImage,
  onToggleCoverImageSelection
}: AlbumInfoModalProps) {
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
              className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${
                isSelectingCoverImage ? 'bg-opacity-30' : 'bg-opacity-50'
              }`}
              onClick={isSelectingCoverImage ? undefined : onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ 
                opacity: isSelectingCoverImage ? 0.3 : 1, 
                scale: 1, 
                y: 0,
                pointerEvents: isSelectingCoverImage ? 'none' : 'auto'
              }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#111111] border border-gray-700 rounded-lg shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">앨범 정보 수정</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                  disabled={isSelectingCoverImage}
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Cover Image */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-3">대표 이미지</p>
                  <div className="flex items-center gap-4">
                    {albumInfo.coverImage ? (
                      <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={albumInfo.coverImage.src}
                          alt={albumInfo.coverImage.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">없음</span>
                      </div>
                    )}
                    <button
                      onClick={onToggleCoverImageSelection}
                      className={`group relative overflow-hidden px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 ${
                        isSelectingCoverImage 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg hover:shadow-red-500/25' 
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-lg hover:shadow-orange-500/25'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative">
                        {isSelectingCoverImage ? '취소' : '변경'}
                      </span>
                    </button>
                  </div>
                  {isSelectingCoverImage && (
                    <p className="text-xs text-orange-400 mt-2">
                      모달 외부의 사진을 클릭하여 대표 이미지를 선택하세요
                    </p>
                  )}
                </div>

                {/* Album Title */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">앨범 제목</p>
                  <input
                    type="text"
                    value={albumInfo.title}
                    onChange={(e) => onAlbumInfoChange('title', e.target.value)}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none"
                    placeholder="앨범 제목을 입력하세요"
                    disabled={isSelectingCoverImage}
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">시작 날짜</p>
                    <input
                      type="text"
                      value={albumInfo.startDate}
                      onChange={(e) => onAlbumInfoChange('startDate', e.target.value)}
                      className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none"
                      placeholder="YYYY.MM.DD"
                      disabled={isSelectingCoverImage}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">끝 날짜</p>
                    <input
                      type="text"
                      value={albumInfo.endDate}
                      onChange={(e) => onAlbumInfoChange('endDate', e.target.value)}
                      className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none"
                      placeholder="YYYY.MM.DD"
                      disabled={isSelectingCoverImage}
                    />
                  </div>
                </div>

                {/* Album Description */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">앨범 설명</p>
                  <textarea
                    value={albumInfo.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        onAlbumInfoChange('description', e.target.value)
                      }
                    }}
                    className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded border border-orange-500/30 focus:border-orange-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="앨범 설명을 입력하세요 (최대 100자)"
                    maxLength={100}
                    disabled={isSelectingCoverImage}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {albumInfo.description.length}/100자
                    </span>
                    {albumInfo.description.length > 80 && (
                      <span className="text-xs text-orange-400">
                        {100 - albumInfo.description.length}자 남음
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
                  disabled={isSelectingCoverImage}
                >
                  <span className="relative">취소</span>
                </button>
                <button
                  onClick={onClose}
                  className="group relative p-px rounded-lg overflow-hidden bg-gray-700 text-white transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 disabled:opacity-50"
                  disabled={isSelectingCoverImage}
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