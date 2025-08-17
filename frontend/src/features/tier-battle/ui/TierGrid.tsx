"use client";

import Image from "next/image";
import { Photo } from "@/entities/photo";
import { TierData, DragOverPosition, TierConfig } from "../model/types";
import { TIER_COLORS, getTierColor } from "@/shared/config/tierColors";

interface TierGridProps {
  tiers: TierConfig[];
  tierPhotos: TierData;
  dragOverPosition: DragOverPosition | null;
  draggingPhotoId: number | null;
  onReturnToAvailable: (photoId: number, fromTier: string) => void;
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
  onImageClick: (photo: Photo) => void; // 사진 클릭 시 모달 열기
}

export function TierGrid({
  tiers,
  tierPhotos,
  dragOverPosition,
  draggingPhotoId,
  onReturnToAvailable,
  onDragOverTierArea,
  onDropTierArea,
  onDragOverPosition,
  onDropAtPosition,
  onDragStart,
  onDragEnd,
  onImageClick,
}: TierGridProps) {
  return (
    <div className="bg-[#222222] rounded-xl shadow-lg border border-gray-700 p-4 space-y-2 relative">
      {/* 배경 텍스트 Keepick */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span className="text-[12rem] font-keepick-heavy text-gray-800/10 select-none tracking-wider transform rotate-12">
          Keepick
        </span>
      </div>
      {tiers.map(({ label, color }) => (
        <div key={label} className="flex items-start relative z-10">
          <div
            className="w-16 h-28 flex-shrink-0 flex items-center justify-center text-3xl font-black rounded-l-md bg-gray-800 border-r border-gray-600 relative"
          >
            <span 
              style={{ color: getTierColor(label as keyof typeof TIER_COLORS) }}
            >
              {label}
            </span>
            <div 
              className="absolute left-0 top-0 w-1 h-full rounded-l-md"
              style={{ backgroundColor: getTierColor(label as keyof typeof TIER_COLORS) }}
            />
          </div>
          <div
            className="flex-1 p-2 flex flex-wrap gap-2 items-center border-t border-b
  border-r border-gray-600 rounded-r-md min-h-[112px] bg-[#111111]"
            onDragOver={(e) => {
              e.preventDefault(); // 드롭을 가능하게 하기 위해 필수
              onDragOverTierArea(e, label);
            }}
            onDrop={(e) => {
              e.preventDefault(); // 브라우저 기본 동작 방지
              onDropTierArea(e, label);
            }}
          >
            {(tierPhotos[label] || []).map((photo, index) => (
              <div
                key={photo.id}
                className="flex items-center"
                onDragOver={(e) => {
                  e.preventDefault(); // 드롭을 가능하게 하기 위해 필수
                  e.stopPropagation(); // 이벤트 버블링 방지
                  onDragOverPosition(e, label, index);
                }}
                onDrop={(e) => {
                  e.preventDefault(); // 브라우저 기본 동작 방지
                  e.stopPropagation(); // 이벤트 버블링 방지
                  onDropAtPosition(e, label, dragOverPosition?.index ?? index);
                }}
              >
                {dragOverPosition?.tier === label &&
                  dragOverPosition.index === index && (
                    <div className="w-1.5 h-20 bg-[#FE7A25] rounded-full transition-all" />
                  )}

                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, photo, label)}
                  onDragEnd={onDragEnd}
                  className="relative group"
                >
                  {/* 정사각형 컨테이너로 Next.js Image 사용 - 갤러리 선택 사진과 동일한 스타일 */}
                  <div 
                    className="relative w-22 h-22 overflow-hidden rounded-md shadow-md cursor-pointer"
                    onClick={() => onImageClick(photo)}
                  >
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.name || `Photo ${photo.id}`}
                      fill
                      sizes="88px"
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  </div>

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
                <div className="w-1.5 h-20 bg-[#FE7A25] rounded-full ml-2 transition-all" />
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
