"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 중복 사진 추가 시 표시되는 에러 모달 컴포넌트
 */
interface DuplicatePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateCount?: number; // 중복된 사진 개수 (선택사항)
  totalCount?: number; // 전체 선택한 사진 개수 (선택사항)
}

export function DuplicatePhotoModal({ 
  isOpen, 
  onClose, 
  duplicateCount,
  totalCount 
}: DuplicatePhotoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 스크롤 잠금
      document.body.style.overflow = 'hidden';
    } else {
      // 모달이 닫힐 때 스크롤 잠금 해제
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md mx-4 bg-[#222222] rounded-xl border border-gray-700 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h2 className="text-xl font-keepick-primary font-bold text-white">
                  사진 추가 실패
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="px-6 pb-6">
              <div className="mb-4">
                <p className="text-white/90 leading-relaxed">
                  이미 앨범에 있는 사진은 추가할 수 없습니다!
                </p>
                {duplicateCount && totalCount && (
                  <p className="text-white/60 text-sm mt-2">
                    선택한 {totalCount}장 중 {duplicateCount}장이 이미 앨범에 포함되어 있습니다.
                  </p>
                )}
              </div>

              <div className="bg-[#333333] rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  💡 해결 방법
                </h3>
                <ul className="text-sm text-white/60 space-y-1">
                  <li>• 다른 사진을 선택해주세요</li>
                  <li>• 중복되지 않은 사진만 추가됩니다</li>
                </ul>
              </div>

              {/* 확인 버튼 */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#FE7A25] hover:bg-[#FE7A25]/90 text-white font-medium rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}