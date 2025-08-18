"use client";

import { ReactNode } from "react";
import { DragPhotoData } from "@/entities/photo";

/**
 * 사진을 드롭할 수 있는 영역을 정의하는 컴포넌트입니다.
 * 타임라인 이벤트 카드나 티어 그리드 영역 등이 이 컴포넌트를 사용합니다.
 */
export interface PhotoDropZoneProps {
  onDrop: (dragData: DragPhotoData, e: React.DragEvent) => void; // 사진을 드롭했을 때 호출될 콜백 함수
  onDragOver?: (e: React.DragEvent) => void; // 드래그 중인 사진이 영역 위로 올라왔을 때 호출될 콜백 함수
  onDragLeave?: (e: React.DragEvent) => void; // 드래그 중인 사진이 영역을 벗어났을 때 호출될 콜백 함수
  isDragOver?: boolean; // 현재 이 영역 위에 드래그가 되고 있는지 여부 (스타일링에 사용)
  children: ReactNode; // 드롭 존 내부에 표시될 자식 요소들
  className?: string; // 컨테이너에 적용할 CSS 클래스
  dropZoneId?: string; // 드롭 존을 식별하기 위한 ID
  draggable?: boolean; // 이 요소를 드래그 가능하게 만들지 여부
  onDragStart?: (e: React.DragEvent) => void; // 드래그 시작 시 호출될 콜백 함수
  onDragEnd?: (e: React.DragEvent) => void; // 드래그 종료 시 호출될 콜백 함수
}

export function PhotoDropZone({
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  children,
  className = "",
  dropZoneId,
  draggable = false,
  onDragStart,
  onDragEnd,
}: PhotoDropZoneProps) {
  /**
   * 드래그 중인 요소가 영역 위에 있을 때 호출되는 핸들러입니다.
   * `e.preventDefault()`를 호출하여 드롭이 가능하도록 설정합니다.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  /**
   * 영역에 사진을 드롭했을 때 호출되는 핸들러입니다.
   * 드래그 데이터를 파싱하여 `onDrop` 콜백으로 전달합니다.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const dragDataString = e.dataTransfer.getData("text/plain");
      
      // 비어있거나 유효하지 않은 데이터 검사
      if (!dragDataString || dragDataString.trim() === '') {
        console.warn('PhotoDropZone: 빈 드래그 데이터를 받았습니다');
        return;
      }
      
      const dragData = JSON.parse(dragDataString) as DragPhotoData;
      
      // 기본 필드 검증
      if (!dragData.photoId) {
        console.warn('PhotoDropZone: 유효하지 않은 드래그 데이터입니다:', dragData);
        return;
      }
      
      onDrop(dragData, e);
    } catch (error) {
      console.error('PhotoDropZone: 드래그 데이터 파싱 실패:', error);
      console.error('원본 데이터:', e.dataTransfer.getData("text/plain"));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={onDragLeave}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`transition-all duration-300 ${className} ${
        isDragOver ? "ring-2 ring-teal-400" : ""
      }`}
      data-drop-zone-id={dropZoneId}
    >
      {children}
    </div>
  );
}