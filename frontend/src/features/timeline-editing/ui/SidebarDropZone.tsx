"use client";

import React, { useState } from "react";
import { Photo, DragPhotoData } from "@/entities/photo";
import { DraggablePhotoGrid, DroppableArea } from "@/features/photo-drag-drop";
import { ArrowLeft, Trash2 } from "lucide-react";

interface SidebarDropZoneProps {
  availablePhotos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
  onPhotoReturn: (photoId: string) => void;
}

export function SidebarDropZone({
  availablePhotos,
  onPhotoClick,
  onPhotoReturn,
}: SidebarDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (dragData: DragPhotoData) => {
    // 섹션에서 사이드바로 사진을 드래그한 경우
    if (dragData.source.startsWith("section-")) {
      onPhotoReturn(dragData.photoId);
    }
    setIsDragOver(false);
  };

  const handleDragOver = () => {
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <DroppableArea
      id="sidebar-dropzone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      isDragOver={isDragOver}
      className={`w-80 bg-gray-900 border-l border-gray-700 p-4 h-screen sticky top-20 overflow-y-auto transition-all duration-200 ${
        isDragOver ? "bg-green-800 border-green-500" : ""
      }`}
      acceptFromSources={["section-"]} // 섹션에서만 드롭 허용 (부분 매칭)
    >
      <div className="relative">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-white">사진 라이브러리</h3>
          {isDragOver && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowLeft size={16} />
              <span>여기에 놓으세요</span>
            </div>
          )}
        </div>

        {/* 드래그 오버 시 표시되는 안내 */}
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-900 bg-opacity-80 rounded-lg border-2 border-dashed border-green-400">
            <div className="text-center text-white">
              <Trash2 size={48} className="mx-auto mb-3 text-green-400" />
              <p className="text-lg font-medium">사진을 라이브러리로 되돌리기</p>
              <p className="text-sm text-green-200 mt-1">사진을 놓으면 섹션에서 제거됩니다</p>
            </div>
          </div>
        )}

        {/* 사진 그리드 */}
        <div className={`transition-opacity duration-200 ${isDragOver ? "opacity-30" : "opacity-100"}`}>
          {availablePhotos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-2">사용 가능한 사진이 없습니다</p>
              <p className="text-gray-500 text-xs">
                갤러리에서 사진을 'Pick'해서<br />
                가져와주세요
              </p>
            </div>
          ) : (
            <DraggablePhotoGrid
              photos={availablePhotos}
              onPhotoClick={onPhotoClick}
              gridClassName="grid grid-cols-3 gap-2"
              photoClassName="w-full h-full object-cover rounded-md aspect-square hover:scale-105 transition-transform cursor-grab"
              sourceId="sidebar"
            />
          )}
        </div>

        {/* 도움말 */}
        <div className={`mt-6 p-4 bg-gray-800 rounded-lg transition-opacity duration-200 ${isDragOver ? "opacity-30" : "opacity-100"}`}>
          <h4 className="font-medium mb-2 text-sm text-white">사용법</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• 사진을 드래그해서 섹션에 추가</li>
            <li>• 섹션의 사진을 여기로 드래그해서 제거</li>
            <li>• 섹션을 클릭해서 텍스트 편집</li>
            <li>• 완료 후 저장 버튼 클릭</li>
          </ul>
        </div>
      </div>
    </DroppableArea>
  );
}