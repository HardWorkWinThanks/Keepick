"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Photo } from "@/entities/photo";

/**
 * 사진 확대 모달 컴포넌트
 * Portal을 사용하여 사이드바와 헤더 위에 표시됩니다.
 */
interface PhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoModal({ photo, isOpen, onClose }: PhotoModalProps) {
  const [mounted, setMounted] = useState(false);

  // 컴포넌트가 마운트되었는지 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      // 모달이 열릴 때 스크롤 잠금
      document.body.style.overflow = "hidden";
    } else {
      // 모달이 닫힐 때 스크롤 잠금 해제
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // 서버 사이드 렌더링 중에는 Portal을 사용하지 않음
  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[10000] w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
          >
            <X size={20} />
          </button>

          {/* 이미지 컨테이너 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photo.src}
              alt={photo.name || `Photo ${photo.id}`}
              width={0}
              height={0}
              sizes="(max-width: 90vw) 90vw, (max-height: 90vh) 90vh"
              className="max-w-[85vw] max-h-[85vh] min-w-[200px] min-h-[200px] w-auto h-auto object-contain rounded-lg"
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Portal을 사용하여 document.body에 직접 렌더링
  return createPortal(modalContent, document.body);
}