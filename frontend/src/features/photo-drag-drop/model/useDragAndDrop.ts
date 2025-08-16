"use client";

import { useState, useCallback } from "react";
import { Photo, DragPhotoData } from "@/entities/photo";

export interface DragState {
  isDragging: boolean;
  draggedPhotoId: number | null;
  draggedPhotoSource: string | null;
  dragOverTarget: string | null;
  dragOverPosition: number | null;
}

export interface DragHandlers {
  handleDragStart: (photo: Photo, source: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (targetId: string, position?: number) => void;
  handleDragLeave: () => void;
  handleDrop: (targetId: string, dragData: DragPhotoData, position?: number) => void;
}

export interface UseDragAndDropProps {
  onPhotoMove?: (photo: Photo, fromSource: string, toTarget: string, position?: number) => void;
  onPhotoRemove?: (photo: Photo, fromSource: string) => void;
  onPhotoAdd?: (photo: Photo, toTarget: string, position?: number) => void;
}

/**
 * 재사용 가능한 드래그&드랍 상태 관리 훅
 */
export function useDragAndDrop({
  onPhotoMove,
  onPhotoRemove,
  onPhotoAdd,
}: UseDragAndDropProps = {}) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedPhotoId: null,
    draggedPhotoSource: null,
    dragOverTarget: null,
    dragOverPosition: null,
  });

  const handleDragStart = useCallback((photo: Photo, source: string) => {
    setDragState({
      isDragging: true,
      draggedPhotoId: photo.id,
      draggedPhotoSource: source,
      dragOverTarget: null,
      dragOverPosition: null,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedPhotoId: null,
      draggedPhotoSource: null,
      dragOverTarget: null,
      dragOverPosition: null,
    });
  }, []);

  const handleDragOver = useCallback((targetId: string, position?: number) => {
    setDragState(prev => ({
      ...prev,
      dragOverTarget: targetId,
      dragOverPosition: position ?? null,
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dragOverTarget: null,
      dragOverPosition: null,
    }));
  }, []);

  const handleDrop = useCallback((
    targetId: string, 
    dragData: DragPhotoData, 
    position?: number
  ) => {
    const { draggedPhotoSource } = dragState;
    
    if (!draggedPhotoSource) return;

    // 사진 객체를 찾기 위한 콜백 (실제 구현에서는 상위 컴포넌트에서 제공)
    const draggedPhoto: Photo = {
      id: dragData.photoId,
      originalUrl: dragData.originalUrl || "", // 실제로는 상위에서 제공되어야 함
      thumbnailUrl: dragData.thumbnailUrl || "",
      name: dragData.name || "",
    };

    // 같은 위치로 드랍하는 경우 무시
    if (draggedPhotoSource === targetId && position === dragState.dragOverPosition) {
      handleDragEnd();
      return;
    }

    // 이동 처리
    if (draggedPhotoSource !== targetId) {
      onPhotoMove?.(draggedPhoto, draggedPhotoSource, targetId, position);
    }

    handleDragEnd();
  }, [dragState, onPhotoMove, handleDragEnd]);

  const handlers: DragHandlers = {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };

  return {
    dragState,
    handlers,
  };
}