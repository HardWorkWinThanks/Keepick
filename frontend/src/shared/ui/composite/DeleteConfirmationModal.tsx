"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemCount?: number;
  itemType: "앨범" | "사진";
  warningMessage?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemCount = 1,
  itemType,
  warningMessage,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const displayTitle = title || `${itemType} 삭제`;
  const displayMessage = itemCount > 1 
    ? `선택한 ${itemType}들을 삭제하시겠습니까?`
    : `"${itemName}" ${itemType}을 삭제하시겠습니까?`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-keepick-heavy text-lg">{displayTitle}</h3>
                <p className="text-gray-400 font-keepick-primary text-sm">{displayMessage}</p>
              </div>
            </div>
            
            <div className="mb-6">
              {itemCount > 1 && (
                <p className="text-gray-300 font-keepick-primary text-sm mb-2">
                  <span className="text-[#FE7A25] font-medium">{itemCount}개</span>의 {itemType}이 영구적으로 삭제됩니다.
                </p>
              )}
              
              {warningMessage && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-amber-300 font-keepick-primary text-xs font-medium mb-1">
                        주의 사항
                      </p>
                      <p className="text-amber-200 font-keepick-primary text-xs leading-relaxed">
                        {warningMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-gray-500 font-keepick-primary text-xs">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-keepick-primary text-sm transition-colors rounded disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-keepick-primary text-sm transition-colors rounded disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제하기"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}