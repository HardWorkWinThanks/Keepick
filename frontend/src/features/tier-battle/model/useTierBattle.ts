"use client";

import { useState } from "react";
import { BattleSequence, TierData } from "./types";
import { Photo } from "@/entities/photo";

export function useTierBattle() {
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [battleSequence, setBattleSequence] = useState<BattleSequence | null>(
    null
  );
  const [precisionTierMode, setPrecisionTierMode] = useState(false);

  const handleBattleDecision = (
    winnerId: string,
    tierPhotos: TierData,
    setTierPhotos: React.Dispatch<React.SetStateAction<TierData>>,
    onPhotoRemoveFromAvailable?: (photoId: string) => void
  ) => {
    if (!battleSequence) return;
    const isNewPhotoWin = winnerId === battleSequence.newPhoto.id;

    if (
      isNewPhotoWin &&
      battleSequence.currentOpponentIndex < battleSequence.opponents.length - 1
    ) {
      setBattleSequence((prev) =>
        prev
          ? { ...prev, currentOpponentIndex: prev.currentOpponentIndex + 1 }
          : null
      );
    } else {
      finalizeBattleResult(
        isNewPhotoWin,
        tierPhotos,
        setTierPhotos,
        onPhotoRemoveFromAvailable
      );
    }
  };

  const finalizeBattleResult = (
    isNewPhotoWin: boolean,
    tierPhotos: TierData,
    setTierPhotos: React.Dispatch<React.SetStateAction<TierData>>,
    onPhotoRemoveFromAvailable?: (photoId: string) => void
  ) => {
    if (!battleSequence) return;
    const {
      newPhoto,
      targetTier,
      sourceType,
      opponents,
      currentOpponentIndex,
      targetIndex,
    } = battleSequence;

    // 일단 const로
    const finalIndex = isNewPhotoWin
      ? targetIndex - opponents.length
      : tierPhotos[targetTier].findIndex(
          (p) => p.id === opponents[currentOpponentIndex].id
        ) + 1;

    setTierPhotos((prev) => {
      const newTiers = { ...prev };
      if (sourceType === "available") {
        onPhotoRemoveFromAvailable?.(newPhoto.id);
      } else {
        newTiers[sourceType] = newTiers[sourceType].filter(
          (p) => p.id !== newPhoto.id
        );
      }
      const targetArray = [...(newTiers[targetTier] || [])];
      targetArray.splice(finalIndex, 0, newPhoto);
      newTiers[targetTier] = targetArray;
      return newTiers;
    });

    setShowComparisonModal(false);
    setBattleSequence(null);
  };

  const handleCloseBattleModal = () => {
    setShowComparisonModal(false);
    setBattleSequence(null);
  };

  return {
    showComparisonModal,
    setShowComparisonModal,
    battleSequence,
    setBattleSequence,
    precisionTierMode,
    setPrecisionTierMode,
    handleBattleDecision,
    handleCloseBattleModal,
  };
}
