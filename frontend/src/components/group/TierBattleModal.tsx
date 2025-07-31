// components/group/TierBattleModal.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";

// 타입 정의
interface Photo {
  id: string;
  src: string;
  name: string;
}

interface BattleSequence {
  newPhoto: Photo;
  opponents: Photo[];
  currentOpponentIndex: number;
}

interface TierBattleModalProps {
  isOpen: boolean;
  battleSequence: BattleSequence | null;
  onClose: () => void; // 배틀 취소
  onDecision: (winnerId: string) => void; // 승자 결정
}

export default function TierBattleModal({
  isOpen,
  battleSequence,
  onClose,
  onDecision,
}: TierBattleModalProps) {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // 새로운 대결이 시작되면 선택 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      setSelectedPhotoId(null);
    }
  }, [isOpen, battleSequence]);

  if (!isOpen || !battleSequence) {
    return null;
  }

  const { newPhoto, opponents, currentOpponentIndex } = battleSequence;
  const currentOpponent = opponents[currentOpponentIndex];

  // currentOpponent가 없을 경우(오류 방지) 모달을 렌더링하지 않습니다.
  if (!currentOpponent) {
    console.error("Battle opponent is missing.");
    onClose(); // 문제가 있으면 모달을 닫습니다.
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-1 rounded-full transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">정밀 티어 배틀</h2>
          <p className="text-gray-500 mt-1">
            더 마음에 드는 사진을 선택하세요.
            <span className="font-semibold text-[var(--primary-color)] ml-2">
              (대결 {currentOpponentIndex + 1} / {opponents.length})
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 새로운 사진 */}
          <div
            className={`relative rounded-lg overflow-hidden cursor-pointer border-4 transition-all duration-300 ${
              selectedPhotoId === newPhoto.id
                ? "border-[var(--primary-color)] shadow-xl scale-105"
                : "border-transparent"
            }`}
            onClick={() => setSelectedPhotoId(newPhoto.id)}
          >
            <Image
              src={newPhoto.src}
              alt={newPhoto.name}
              width={500}
              height={500}
              className="w-full h-auto object-cover aspect-square"
            />
            <div className="absolute bottom-0 left-0 bg-black/50 text-white p-2 text-center w-full">
              <p className="font-bold">새로운 사진</p>
              <p className="text-sm">{newPhoto.name}</p>
            </div>
          </div>

          {/* 기존 사진 (상대) */}
          <div
            className={`relative rounded-lg overflow-hidden cursor-pointer border-4 transition-all duration-300 ${
              selectedPhotoId === currentOpponent.id
                ? "border-[var(--primary-color)] shadow-xl scale-105"
                : "border-transparent"
            }`}
            onClick={() => setSelectedPhotoId(currentOpponent.id)}
          >
            <Image
              src={currentOpponent.src}
              alt={currentOpponent.name}
              width={500}
              height={500}
              className="w-full h-auto object-cover aspect-square"
            />
            <div className="absolute bottom-0 left-0 bg-black/50 text-white p-2 text-center w-full">
              <p className="font-bold">기존 사진</p>
              <p className="text-sm">{currentOpponent.name}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDecision(selectedPhotoId!)}
          disabled={!selectedPhotoId}
          className="w-full mt-6 py-3 bg-[var(--primary-color)] text-white font-bold rounded-lg text-lg transition-all
                     disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#2fa692]"
        >
          결정하기
        </button>
      </div>
    </div>
  );
}
