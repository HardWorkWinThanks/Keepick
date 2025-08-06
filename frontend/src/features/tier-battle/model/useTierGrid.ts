"use client";

import { useState } from "react";
import { Photo } from "@/entities/photo";
import { TierData, DragOverPosition, TierConfig } from "./types";

/**
 * 티어 앨범의 그리드 UI와 관련된 상태 및 기본 상호작용을 관리하는 커스텀 훅입니다.
 * 사진 드래그, 드롭 위치 추적, 티어에서 사진 제거 등의 로직을 담당합니다.
 * @returns 그리드 UI 관련 상태와 핸들러 함수들을 반환합니다.
 */
export function useTierGrid() {
  // 전체 티어의 사진 데이터를 관리하는 상태. { "S": [photo1], "A": [photo2, photo3] } 형태.
  const [tierPhotos, setTierPhotos] = useState<TierData>({});

  // 사진을 드래그할 때, 마우스가 올라간 위치(티어, 인덱스)를 추적하는 상태
  const [dragOverPosition, setDragOverPosition] =
    useState<DragOverPosition | null>(null);

  // 현재 드래그 중인 사진의 ID를 저장하는 상태
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);

  // 티어의 종류와 각 티어의 색상을 정의하는 설정 배열
  const tiers: TierConfig[] = [
    { label: "S", color: "from-amber-300 to-yellow-400" },
    { label: "A", color: "from-sky-300 to-blue-500" },
    { label: "B", color: "from-teal-300 to-emerald-500" },
    { label: "C", color: "from-orange-300 to-rose-400" },
    { label: "D", color: "from-gray-300 to-slate-500" },
  ];

  /**
   * 특정 티어에 있는 사진을 '사용 가능한 사진(available)' 목록으로 되돌리는 핸들러입니다.
   * @param photoId - 되돌릴 사진의 ID
   * @param fromTier - 사진이 원래 있던 티어의 레이블
   * @param onReturn - 사진을 available 목록에 다시 추가하기 위해 호출할 콜백 함수
   */
  const handleReturnToAvailable = (
    photoId: string,
    fromTier: string,
    onReturn: (photo: Photo) => void
  ) => {
    const photo = tierPhotos[fromTier]?.find((p) => p.id === photoId);
    if (photo) {
      // `tierPhotos` 상태에서 해당 사진을 제거합니다.
      setTierPhotos((prev) => ({
        ...prev,
        [fromTier]: prev[fromTier].filter((p) => p.id !== photoId),
      }));
      // 콜백 함수를 호출하여 부모 컴포넌트의 'availablePhotos' 상태를 업데이트하도록 합니다.
      onReturn(photo);
    }
  };

  return {
    tierPhotos,
    setTierPhotos,
    tiers,
    dragOverPosition,
    setDragOverPosition,
    draggingPhotoId,
    setDraggingPhotoId,
    handleReturnToAvailable,
  };
}