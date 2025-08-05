"use client";

import { ReactNode } from "react";
import { DragPhotoData } from "@/entities/photo";

export interface PhotoDropZoneProps {
  onDrop: (dragData: DragPhotoData, e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  children: ReactNode;
  className?: string;
  dropZoneId?: string;
}

export function PhotoDropZone({
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  children,
  className = "",
  dropZoneId,
}: PhotoDropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragData = JSON.parse(
      e.dataTransfer.getData("text/plain")
    ) as DragPhotoData;
    onDrop(dragData, e);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={onDragLeave}
      className={`transition-all duration-300 ${className} ${
        isDragOver ? "ring-2 ring-teal-400" : ""
      }`}
      data-drop-zone-id={dropZoneId}
    >
      {children}
    </div>
  );
}
