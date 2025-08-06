"use client";

import Image from "next/image";
import { Photo } from "@/entities/photo";
import { useEffect, useCallback } from "react";

/**
 * 사진을 클릭했을 때 전체 화면으로 크게 보여주는 모달 컴포넌트입니다.
 */
interface PhotoModalProps {
  photo: Photo | null; // 표시할 사진 객체. null이면 모달이 닫힙니다.
  isOpen: boolean; // 모달의 열림/닫힘 상태
  onClose: () => void; // 모달을 닫을 때 호출될 콜백 함수
}

export function PhotoModal({ photo, isOpen, onClose }: PhotoModalProps) {
  /**
   * 키보드의 'Escape' 키를 눌렀을 때 모달을 닫는 핸들러입니다.
   * `useCallback`으로 감싸 불필요한 함수 재생성을 방지합니다.
   */
  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  // 모달이 열리거나 닫힐 때 side effect를 처리합니다.
  useEffect(() => {
    if (isOpen) {
      // 모달이 열리면, ESC 키 이벤트 리스너를 추가하고
      // 뒷 배경의 스크롤을 막습니다.
      document.addEventListener("keydown", handleEsc, { passive: true });
      document.body.style.overflow = "hidden";
    }

    // 컴포넌트가 언마운트되거나, isOpen 상태가 false로 변할 때 실행되는 클린업 함수입니다.
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEsc]);

  // 모달이 닫혀있거나, 표시할 사진이 없으면 아무것도 렌더링하지 않습니다.
  if (!isOpen || !photo) return null;

  return (
    // 모달 배경 (클릭 시 닫힘)
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      {/* 이미지 컨테이너 (배경 클릭 이벤트 전파 방지) */}
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
          priority // Next.js 이미지 최적화: 이 이미지를 우선적으로 로드
        />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {/* 간단한 페이드인/스케일인 애니메이션을 위한 인라인 스타일 */}
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