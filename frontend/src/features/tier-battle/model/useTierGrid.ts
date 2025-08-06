"use client";

import { useState } from "react";
import { Photo } from "@/entities/photo";
import { TierData, DragOverPosition, TierConfig } from "./types";

export function useTierGrid() {
  const [tierPhotos, setTierPhotos] = useState<TierData>({});
  const [dragOverPosition, setDragOverPosition] =
    useState<DragOverPosition | null>(null);
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);

  const tiers: TierConfig[] = [
    { label: "S", color: "from-amber-300 to-yellow-400" },
    { label: "A", color: "from-sky-300 to-blue-500" },
    { label: "B", color: "from-teal-300 to-emerald-500" },
    { label: "C", color: "from-orange-300 to-rose-400" },
    { label: "D", color: "from-gray-300 to-slate-500" },
  ];

  const handleReturnToAvailable = (
    photoId: string,
    fromTier: string,
    onReturn: (photo: Photo) => void
  ) => {
    const photo = tierPhotos[fromTier]?.find((p) => p.id === photoId);
    if (photo) {
      setTierPhotos((prev) => ({
        ...prev,
        [fromTier]: prev[fromTier].filter((p) => p.id !== photoId),
      }));
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
