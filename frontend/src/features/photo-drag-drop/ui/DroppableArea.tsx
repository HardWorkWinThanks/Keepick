"use client";

import React from "react";
import { DragPhotoData } from "@/entities/photo";

export interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  onDrop: (dragData: DragPhotoData, position?: number) => void;
  onDragOver?: (position?: number) => void;
  onDragLeave?: () => void;
  isDragOver?: boolean;
  className?: string;
  acceptFromSources?: string[]; // 특정 소스에서만 드롭 허용
  placeholder?: React.ReactNode; // 빈 상태일 때 표시할 내용
  showDropIndicator?: boolean;
  dropIndicatorPosition?: number;
}

/**
 * 강화된 드롭 가능 영역 컴포넌트
 * 시각적 피드백과 위치 지정 드랍을 지원합니다.
 */
export function DroppableArea({
  id,
  children,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver = false,
  className = "",
  acceptFromSources,
  placeholder,
  showDropIndicator = false,
  dropIndicatorPosition,
}: DroppableAreaProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 드롭 위치 계산 (선택사항)
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const elementHeight = rect.height;
    const position = Math.round((mouseY / elementHeight) * 10); // 0-10 범위로 정규화

    onDragOver?.(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 자식 요소로 이동하는 경우는 무시
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      onDragLeave?.();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const dragData = JSON.parse(
        e.dataTransfer.getData("text/plain")
      ) as DragPhotoData;

      // 소스 필터링 (부분 매칭 지원)
      if (acceptFromSources && acceptFromSources.length > 0) {
        const isAccepted = acceptFromSources.some(acceptedSource => 
          dragData.source.startsWith(acceptedSource) || acceptedSource.startsWith(dragData.source)
        );
        if (!isAccepted) {
          return;
        }
      }

      // 드롭 위치 계산
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const elementHeight = rect.height;
      const position = Math.round((mouseY / elementHeight) * 10);

      onDrop(dragData, position);
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  return (
    <div
      className={`
        relative transition-all duration-200
        ${className}
        ${isDragOver ? "ring-2 ring-blue-400 ring-opacity-60 bg-blue-50" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-drop-zone-id={id}
    >
      {children}
      
      {/* 드롭 인디케이터 */}
      {showDropIndicator && isDragOver && (
        <div 
          className="absolute w-full h-1 bg-blue-400 rounded-full z-10 transition-all duration-150"
          style={{
            top: `${(dropIndicatorPosition || 0) * 10}%`,
          }}
        />
      )}
      
      {/* 빈 상태 플레이스홀더 */}
      {!children && placeholder && (
        <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
          {placeholder}
        </div>
      )}
    </div>
  );
}