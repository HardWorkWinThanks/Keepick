"use client";

import Image from "next/image";
import { Photo } from "@/entities/photo";
import { useEffect, useCallback } from "react";

interface PhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoModal({ photo, isOpen, onClose }: PhotoModalProps) {
  // useCallback으로 함수 메모이제이션
  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      // 한 번에 DOM 조작
      document.addEventListener("keydown", handleEsc, { passive: true });
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEsc]);

  if (!isOpen || !photo) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        animation: "fadeIn 0.15s ease-out", // CSS 애니메이션 최적화
      }}
    >
      <div
        className="relative max-w-4xl max-h-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "scaleIn 0.2s ease-out",
        }}
      >
        <Image
          src={photo.src}
          alt={photo.name || photo.id}
          width={1200}
          height={800}
          className="object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: "90vh", maxWidth: "90vw" }}
          priority // Next.js 최적화: 우선 로드
          unoptimized={photo.src.startsWith("/")} // 로컬 이미지는 최적화 생략
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
