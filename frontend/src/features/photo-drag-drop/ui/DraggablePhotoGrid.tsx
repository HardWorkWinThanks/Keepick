"use client";

import Image from "next/image";
import { Photo, DragPhotoData } from "@/entities/photo";

/**
 * 드래그 가능한 사진들로 구성된 그리드 UI를 렌더링하는 컴포넌트입니다.
 * '사용 가능한 사진' 목록 등을 표시하는 데 사용됩니다.
 */
export interface DraggablePhotoGridProps {
  photos: Photo[]; // 그리드에 표시할 사진 객체 배열
  onPhotoClick?: (photo: Photo) => void; // 사진 클릭 시 호출될 콜백 함수
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, photo: Photo, source: string) => void; // 드래그 시작 시 호출될 콜백 함수
  onDragEnd?: () => void; // 드래그 종료 시 호출될 콜백 함수
  gridClassName?: string; // 그리드 컨테이너에 적용할 CSS 클래스
  photoClassName?: string; // 각 사진 이미지에 적용할 CSS 클래스
  draggingPhotoId?: string | null; // 현재 드래그 중인 사진의 ID (투명도 처리에 사용)
  sourceId?: string; // 이 그리드의 출처를 식별하는 ID (예: 'available')
}

export function DraggablePhotoGrid({
  photos,
  onPhotoClick,
  onDragStart,
  onDragEnd,
  gridClassName = "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3",
  photoClassName = "w-full h-auto object-cover rounded-md shadow-sm aspect-square hover:scale-105 transition-transform",
  draggingPhotoId,
  sourceId = "available",
}: DraggablePhotoGridProps) {
  /**
   * 사진 드래그 시작 시 호출되는 핸들러입니다.
   * 드래그 데이터에 사진 ID와 출처(source) 정보를 담습니다.
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, photo: Photo) => {
    const dragData: DragPhotoData = {
      photoId: photo.id,
      source: sourceId,
    };
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(e, photo, sourceId);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div className={gridClassName}>
      {photos.map((photo) => (
        <div
          key={photo.id}
          draggable
          onDragStart={(e) => handleDragStart(e, photo)}
          onDragEnd={handleDragEnd}
          onClick={() => onPhotoClick?.(photo)}
          className={`cursor-grab ${draggingPhotoId === photo.id ? "opacity-40" : ""}`}>
          <Image
            src={photo.src}
            alt={photo.name || photo.id}
            width={88}
            height={88}
            className={photoClassName}
          />
        </div>
      ))}
    </div>
  );
}