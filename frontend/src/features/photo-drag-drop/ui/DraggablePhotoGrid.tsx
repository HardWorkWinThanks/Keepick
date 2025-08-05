  "use client";

  import Image from "next/image";
  import { Photo, DragPhotoData } from "@/entities/photo";
  // import React from "react";

  export interface DraggablePhotoGridProps {
    photos: Photo[];
    onPhotoClick?: (photo: Photo) => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, photo: Photo, source: string) => void;
    onDragEnd?: () => void;
    gridClassName?: string;
    photoClassName?: string;
    draggingPhotoId?: string | null;
    sourceId?: string;
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
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, photo: Photo) => {
      const dragData: DragPhotoData = {
        photoId: photo.id,
        source: sourceId,
      };
      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
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
            className={`cursor-grab ${draggingPhotoId === photo.id ? "opacity-40" : ""}`}
          >
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