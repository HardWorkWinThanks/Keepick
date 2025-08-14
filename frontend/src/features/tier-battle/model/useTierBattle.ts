"use client";

import { useState } from "react";
import { BattleSequence, TierData } from "./types";
import { Photo } from "@/entities/photo";

/**
 * '정밀 배틀' 모드의 상태와 로직을 관리하는 커스텀 훅입니다.
 * 사진을 특정 위치에 두려고 할 때, 기존 사진들과 1:1 비교를 통해 순위를 결정하는 기능입니다.
 * @returns 배틀 관련 상태와 로직 제어 함수들을 반환합니다.
 */
export function useTierBattle() {
  // 사진 비교 모달의 표시 여부 상태
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  // 현재 진행 중인 배틀의 정보 상태
  const [battleSequence, setBattleSequence] = useState<BattleSequence | null>(
    null
  );
  // '정밀 배틀' 모드의 활성화 여부 상태
  const [precisionTierMode, setPrecisionTierMode] = useState(false);

  /**
   * 배틀 모달에서 사용자가 승자를 선택했을 때 호출되는 핸들러입니다.
   * @param winnerId - 사용자가 선택한 사진(승자)의 ID
   * @param tierPhotos - 현재 전체 티어의 사진 데이터
   * @param setTierPhotos - tierPhotos 상태를 업데이트하는 함수
   * @param onPhotoRemoveFromAvailable - (선택) 사진이 'available' 목록에서 왔을 경우, 해당 목록에서 사진을 제거하기 위한 콜백 함수
   */
  const handleBattleDecision = (
    winnerId: number,
    tierPhotos: TierData,
    setTierPhotos: React.Dispatch<React.SetStateAction<TierData>>,
    onPhotoRemoveFromAvailable?: (photoId: number) => void
  ) => {
    if (!battleSequence) return;

    const isNewPhotoWin = winnerId === battleSequence.newPhoto.id;

    // 새로운 사진이 이겼고, 아직 비교할 상대가 더 남았다면
    if (
      isNewPhotoWin &&
      battleSequence.currentOpponentIndex < battleSequence.opponents.length - 1
    ) {
      // 다음 상대를 비교하도록 배틀 상태를 업데이트합니다.
      setBattleSequence((prev) =>
        prev
          ? { ...prev, currentOpponentIndex: prev.currentOpponentIndex + 1 }
          : null
      );
    } else {
      // 배틀이 종료된 경우 (새 사진이 졌거나, 모든 상대에게 이겼을 때)
      finalizeBattleResult(
        isNewPhotoWin,
        tierPhotos,
        setTierPhotos,
        onPhotoRemoveFromAvailable
      );
    }
  };

  /**
   * 배틀 결과를 최종적으로 처리하고, 사진을 티어에 배치합니다.
   */
  const finalizeBattleResult = (
    isNewPhotoWin: boolean,
    tierPhotos: TierData,
    setTierPhotos: React.Dispatch<React.SetStateAction<TierData>>,
    onPhotoRemoveFromAvailable?: (photoId: number) => void
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

    // 최종적으로 사진이 들어갈 위치(index)를 계산합니다.
    const finalIndex = isNewPhotoWin
      ? targetIndex - opponents.length // 모든 비교에서 이겼을 경우, 원래 목표했던 위치의 맨 앞
      : tierPhotos[targetTier].findIndex(
          (p) => p.id === opponents[currentOpponentIndex].id
        ) + 1; // 패배한 경우, 해당 상대의 바로 다음 자리

    // `setTierPhotos`를 호출하여 전체 티어 데이터를 업데이트합니다.
    setTierPhotos((prev) => {
      const newTiers = { ...prev };
      // 사진의 출처(source)에 따라 목록에서 제거합니다.
      if (sourceType === "available") {
        onPhotoRemoveFromAvailable?.(newPhoto.id);
      } else {
        newTiers[sourceType] = newTiers[sourceType].filter(
          (p) => p.id !== newPhoto.id
        );
      }
      // 목표 티어에 사진을 계산된 위치에 삽입합니다.
      const targetArray = [...(newTiers[targetTier] || [])];
      targetArray.splice(finalIndex, 0, newPhoto);
      newTiers[targetTier] = targetArray;
      return newTiers;
    });

    // 배틀 모달을 닫고, 배틀 상태를 초기화합니다.
    setShowComparisonModal(false);
    setBattleSequence(null);
  };

  /**
   * 배틀 모달을 닫는 핸들러입니다.
   */
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