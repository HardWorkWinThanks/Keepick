// components/group/TierBattleModal.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Photo } from "@/entities/photo";
import { BattleSequence } from "../model/types";

// 타입 정의

interface TierBattleModalProps {
  isOpen: boolean;
  battleSequence: BattleSequence | null;
  onClose: () => void;
  onDecision: (winnerId: string) => void;
  onZoomRequest: (photo: Photo) => void;
}

export default function TierBattleModal({
  isOpen,
  battleSequence,
  onClose,
  onDecision,
  onZoomRequest,
}: TierBattleModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPhoto(null);
    }
  }, [isOpen]);

  if (!isOpen || !battleSequence) return null;

  const { newPhoto, opponents, currentOpponentIndex, targetTier } =
    battleSequence;
  const currentOpponent = opponents[currentOpponentIndex];
  if (!currentOpponent) {
    onClose();
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-gray-700 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] relative animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-500 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-white text-lg transition-all"
        >
          ✕
        </button>

        {/* 좌상단 타이틀 */}
        <div className="absolute top-8 left-8 font-keepick-heavy text-lg text-gray-400">
          TIER BATTLE
        </div>

        {/* 메인 헤더 */}
        <div className="text-center mb-8 mt-12">
          <h1 className="text-3xl font-keepick-heavy text-white mb-2">
            {targetTier}티어 {opponents.length - currentOpponentIndex}위 결정전
          </h1>
          <p className="text-lg text-gray-400">
            더 높은 순위에 두고 싶은 사진을 선택해주세요
          </p>
        </div>

        {/* 대결 영역 */}
        <div className="flex items-center justify-center gap-12 mb-10">
          {/* 기존 사진 */}
          <div className="text-center">
            <div
              className={`relative group mb-4 cursor-pointer`}
              onClick={() => setSelectedPhoto(currentOpponent.id)}
            >
              <div
                className={`w-60 h-60 rounded-lg overflow-hidden transition-all duration-300 relative ${
                  selectedPhoto === currentOpponent.id
                    ? "scale-105"
                    : "hover:scale-102"
                }`}
              >
                <Image
                  src={currentOpponent.src}
                  alt="기존 사진"
                  layout="fill"
                  objectFit="cover"
                />
                <div
                  className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 ${
                    selectedPhoto === currentOpponent.id
                      ? "border-[#FE7A25]"
                      : "border-transparent"
                  }`}
                ></div>
              </div>
            </div>
            <h3 className="text-xl font-keepick-primary text-white mb-2">
              기존 사진
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onZoomRequest(currentOpponent);
              }}
              className="px-4 py-2 border border-gray-500 hover:border-gray-400 text-gray-400 hover:text-white rounded-lg font-keepick-primary transition-all"
            >
              자세히 보기
            </button>
          </div>

          {/* VS 구분선 */}
          <div className="my-4">
            <span className="text-5xl font-keepick-heavy text-gray-500">
              VS
            </span>
          </div>

          {/* 새로운 사진 */}
          <div className="text-center">
            <div
              className={`relative group mb-4 cursor-pointer`}
              onClick={() => setSelectedPhoto(newPhoto.id)}
            >
              <div
                className={`w-60 h-60 rounded-lg overflow-hidden transition-all duration-300 relative ${
                  selectedPhoto === newPhoto.id
                    ? "scale-105"
                    : "hover:scale-102"
                }`}
              >
                <Image
                  src={newPhoto.src}
                  alt="새로운 사진"
                  layout="fill"
                  objectFit="cover"
                />
                <div
                  className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 ${
                    selectedPhoto === newPhoto.id
                      ? "border-[#FE7A25]"
                      : "border-transparent"
                  }`}
                ></div>
              </div>
            </div>
            <h3 className="text-xl font-keepick-primary text-white mb-2">
              새로운 사진
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onZoomRequest(newPhoto);
              }}
              className="px-4 py-2 border border-gray-500 hover:border-gray-400 text-gray-400 hover:text-white rounded-lg font-keepick-primary transition-all"
            >
              자세히 보기
            </button>
          </div>
        </div>

        {/* 결정 버튼 */}
        <div className="text-center">
          {selectedPhoto ? (
            <button
              onClick={() => onDecision(selectedPhoto)}
              className="border-2 border-[#FE7A25] hover:bg-[#FE7A25] text-[#FE7A25] hover:text-black font-keepick-heavy text-lg py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              이걸로 결정하기
            </button>
          ) : (
            <div className="bg-gray-800/30 rounded-lg py-4 px-6 border border-gray-600">
              <p className="text-gray-400 text-base font-keepick-primary">
                위의 두 사진 중 하나를 선택해주세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
