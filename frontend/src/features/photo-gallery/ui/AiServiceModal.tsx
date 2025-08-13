"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Eye, Users, Zap, ImageIcon } from "lucide-react"

interface AiServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSimilarPhotosSort: () => void
}

export default function AiServiceModal({ isOpen, onClose, onSimilarPhotosSort }: AiServiceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-[#111111] border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* 헤더 */}
              <div className="sticky top-0 bg-[#111111] border-b border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-blue-400" size={24} />
                  <h2 className="font-keepick-primary text-lg text-white">Keepick AI</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 내용 */}
              <div className="p-6">
                {/* 소개 문구 */}
                <div className="mb-6">
                  <h3 className="font-keepick-primary text-base text-white mb-2">
                    AI 기능 소개
                  </h3>
                  <p className="text-gray-400 text-sm font-keepick-primary leading-relaxed">
                    사진을 더 똑똑하게 관리하고 정리할 수 있는 AI 기능들입니다.
                  </p>
                </div>

                {/* AI 서비스 목록 */}
                <div className="space-y-3 mb-6">
                  {/* 유사한 사진 분류 */}
                  <div className="border-l-2 border-blue-400 bg-gray-900/50 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <ImageIcon className="text-blue-400" size={18} />
                      <h4 className="font-keepick-primary text-white text-sm">유사한 사진 분류</h4>
                    </div>
                    <p className="text-gray-400 text-xs font-keepick-primary leading-relaxed ml-6">
                      비슷한 구도나 내용의 사진들을 자동으로 그룹화합니다.
                    </p>
                  </div>

                  {/* 객체 인식 */}
                  <div className="border-l-2 border-gray-600 bg-gray-900/30 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Eye className="text-gray-500" size={18} />
                      <h4 className="font-keepick-primary text-white text-sm">객체 인식</h4>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">자동</span>
                    </div>
                    <p className="text-gray-400 text-xs font-keepick-primary leading-relaxed ml-6">
                      업로드 시 사진 속 객체를 인식하여 태그를 자동 생성합니다.
                    </p>
                  </div>

                  {/* 얼굴 매칭 */}
                  <div className="border-l-2 border-gray-600 bg-gray-900/30 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="text-gray-500" size={18} />
                      <h4 className="font-keepick-primary text-white text-sm">얼굴 매칭</h4>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">자동</span>
                    </div>
                    <p className="text-gray-400 text-xs font-keepick-primary leading-relaxed ml-6">
                      그룹원이 포함된 사진들을 자동으로 분류합니다.
                    </p>
                  </div>

                  {/* 흐림 판별 */}
                  <div className="border-l-2 border-gray-600 bg-gray-900/30 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="text-gray-500" size={18} />
                      <h4 className="font-keepick-primary text-white text-sm">품질 분석</h4>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">자동</span>
                    </div>
                    <p className="text-gray-400 text-xs font-keepick-primary leading-relaxed ml-6">
                      흐린 사진이나 화질이 낮은 사진을 자동으로 식별합니다.
                    </p>
                  </div>
                </div>

                {/* 유사한 사진 분류 버튼 */}
                <div className="border-t border-gray-700 pt-4">
                  <motion.button
                    onClick={onSimilarPhotosSort}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-keepick-primary text-sm transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    유사한 사진 분류 시작하기
                  </motion.button>
                  <p className="text-gray-500 text-xs font-keepick-primary mt-2 text-center">
                    현재 갤러리의 사진들을 분석하여 유사한 사진끼리 그룹화합니다
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}