"use client";

import Image from "next/image";
import { Photo } from "@/entities/photo";
import { TierData, DragOverPosition, TierConfig } from "../model/types";

interface TierGridProps {
  tiers: TierConfig[];
  tierPhotos: TierData;
  dragOverPosition: DragOverPosition | null;
  draggingPhotoId: string | null;
  onImageClick: (photo: Photo) => void;
  onReturnToAvailable: (photoId: string, fromTier: string) => void;
  onDragOverTierArea: (e: React.DragEvent, tier: string) => void;
  onDropTierArea: (e: React.DragEvent, targetTier: string) => void;
  onDragOverPosition: (e: React.DragEvent, tier: string, index: number) => void;
  onDropAtPosition: (
    e: React.DragEvent,
    targetTier: string,
    targetIndex: number
  ) => void;
  onDragStart: (e: React.DragEvent, photo: Photo, source: string) => void;
  onDragEnd: () => void;
}

export function TierGrid({
  tiers,
  tierPhotos,
  dragOverPosition,
  draggingPhotoId,
  onImageClick,
  onReturnToAvailable,
  onDragOverTierArea,
  onDropTierArea,
  onDragOverPosition,
  onDropAtPosition,
  onDragStart,
  onDragEnd,
}: TierGridProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border p-4 space-y-2">
      {tiers.map(({ label, color }) => (
        <div key={label} className="flex items-start">
          <div
            className={`w-16 h-28 flex-shrink-0 flex items-center justify-center text-white      
  text-3xl font-black rounded-l-md bg-gradient-to-br ${color}`}
          >
            {label}
          </div>
          <div
            className="flex-1 p-2 flex flex-wrap gap-2 items-center border-t border-b
  border-r rounded-r-md min-h-[112px]"
            onDragOver={(e) => onDragOverTierArea(e, label)}
            onDrop={(e) => onDropTierArea(e, label)}
          >
            {(tierPhotos[label] || []).length === 0 && !draggingPhotoId && (
              <div
                className="w-full h-full flex flex-col items-center justify-center
  text-gray-400 text-center"
              >
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm">사진을 여기에 드래그하세요.</span>
              </div>
            )}
            {(tierPhotos[label] || []).map((photo, index) => (
              <div
                key={photo.id}
                className="flex items-center"
                onDragOver={(e) => onDragOverPosition(e, label, index)}
                onDrop={(e) =>
                  onDropAtPosition(e, label, dragOverPosition?.index ?? index)
                }
              >
                {dragOverPosition?.tier === label &&
                  dragOverPosition.index === index && (
                    <div className="w-1.5 h-20 bg-teal-400 rounded-full transition-all" />
                  )}

                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, photo, label)}
                  onDragEnd={onDragEnd}
                  onClick={() => onImageClick(photo)}
                  className="relative group"
                >
                  <Image
                    src={photo.src}
                    alt={photo.name || photo.id}
                    width={88}
                    height={88}
                    className="rounded-md object-cover cursor-grab w-22 h-22 shadow-md
  hover:scale-105 transition-transform"
                  />

                  {label === "S" && index < 3 && (
                    <div
                      className="absolute -top-2 -left-1 text-2xl z-10 filter
  drop-shadow-lg"
                    >
                      {index === 0 ? "👑" : index === 1 ? "🥈" : "🥉"}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReturnToAvailable(photo.id, label);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white
  rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center      
  justify-center z-10"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {dragOverPosition?.tier === label &&
              dragOverPosition.index === (tierPhotos[label] || []).length && (
                <div className="w-1.5 h-20 bg-teal-400 rounded-full ml-2 transition-all" />
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
