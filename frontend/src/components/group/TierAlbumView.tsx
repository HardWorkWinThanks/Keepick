// components/group/TierAlbumView.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import TierBattleModal from "./TierBattleModal"; // 분리된 배틀 모달 import

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
  targetTier: string;
  targetIndex: number;
  sourceType: string;
}
interface TierAlbumViewProps {
  albumId: string;
  albumTitle: string;
  onBack: () => void;
}

export default function TierAlbumView({
  albumId,
  albumTitle,
  onBack,
}: TierAlbumViewProps) {
  // --- 상태 관리 (States) ---
  const [tierPhotos, setTierPhotos] = useState<{ [key: string]: Photo[] }>({});
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([]);
  const [precisionTierMode, setPrecisionTierMode] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [battleSequence, setBattleSequence] = useState<BattleSequence | null>(
    null
  );
  const [dragOverPosition, setDragOverPosition] = useState<{
    tier: string;
    index: number;
  } | null>(null);

  const tiers = [
    { label: "S", color: "from-yellow-400 to-orange-500" },
    { label: "A", color: "from-blue-500 to-blue-700" },
    { label: "B", color: "from-green-500 to-green-700" },
    { label: "C", color: "from-red-500 to-red-700" },
    { label: "D", color: "from-gray-500 to-gray-700" },
  ];

  // --- 데이터 관리 함수 ---
  useEffect(() => {
    loadTierAlbumData(albumId);
  }, [albumId]);

  const saveTierAlbumData = () => {
    try {
      localStorage.setItem(
        `tierAlbum_${albumId}`,
        JSON.stringify({ tierPhotos, availablePhotos })
      );
      const sTierFirstPhoto = tierPhotos.S?.[0];
      if (sTierFirstPhoto) {
        localStorage.setItem(`tierAlbumCover_${albumId}`, sTierFirstPhoto.src);
      }
      alert("✅ 티어 앨범이 성공적으로 저장되었습니다!");
      onBack();
    } catch (error) {
      console.error("Failed to save data:", error);
      alert("❌ 저장 실패");
    }
  };

  const loadTierAlbumData = (id: string) => {
    try {
      const savedData = localStorage.getItem(`tierAlbum_${id}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        setTierPhotos(data.tierPhotos || { S: [], A: [], B: [], C: [], D: [] });
        setAvailablePhotos(data.availablePhotos || []);
      } else {
        // 초기 데이터 설정
        setTierPhotos({
          S: [{ id: "photo_s1", src: "/jaewan1.jpg", name: "S급 사진1" }],
          A: [],
          B: [],
          C: [],
          D: [],
        });
        setAvailablePhotos([
          { id: "photo1", src: "/ssafy-dummy1.jpg", name: "사진1" },
          { id: "photo2", src: "/ssafy-dummy2.jpg", name: "사진2" },
          { id: "photo3", src: "/ssafy-dummy3.jpg", name: "사진3" },
          { id: "photo4", src: "/ssafy-dummy4.jpg", name: "사진4" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // --- UI 상호작용 함수 ---
  const handleImageClick = (photo: Photo) => {
    setSelectedImage(photo);
    setShowImageModal(true);
  };
  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // --- 드래그 앤 드롭 로직 ---
  const handleDragStart = (
    e: React.DragEvent,
    photo: Photo,
    source: string | "available"
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ photoId: photo.id, source })
    );
  };
  const handleDragOverPosition = (
    e: React.DragEvent,
    tier: string,
    index: number
  ) => {
    e.preventDefault();
    setDragOverPosition({ tier, index });
  };

  const handleDropAtPosition = (
    e: React.DragEvent,
    targetTier: string,
    targetIndex: number
  ) => {
    e.preventDefault();
    setDragOverPosition(null);
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { photoId, source } = data;
    const draggedPhoto =
      source === "available"
        ? availablePhotos.find((p) => p.id === photoId)
        : tierPhotos[source]?.find((p) => p.id === photoId);
    if (!draggedPhoto) return;

    // 같은 위치로 드롭한 경우 무시
    const sourceIndex =
      source !== "available"
        ? tierPhotos[source].findIndex((p) => p.id === photoId)
        : -1;
    if (
      source === targetTier &&
      (targetIndex === sourceIndex || targetIndex === sourceIndex + 1)
    )
      return;

    // 정밀 티어 모드 배틀 시작
    if (
      precisionTierMode &&
      tierPhotos[targetTier]?.length > 0 &&
      source !== targetTier
    ) {
      const opponents = [...tierPhotos[targetTier]]
        .slice(0, targetIndex)
        .reverse();
      if (opponents.length > 0) {
        setBattleSequence({
          newPhoto: draggedPhoto,
          opponents,
          currentOpponentIndex: 0,
          targetTier,
          targetIndex,
          sourceType: source,
        });
        setShowComparisonModal(true);
        return;
      }
    }

    // 일반 드롭 로직
    const newTierPhotos = { ...tierPhotos };
    if (source === "available") {
      setAvailablePhotos((prev) => prev.filter((p) => p.id !== photoId));
    } else {
      newTierPhotos[source] = newTierPhotos[source].filter(
        (p) => p.id !== photoId
      );
    }
    const targetArray = [...(newTierPhotos[targetTier] || [])];
    const adjustedIndex =
      source === targetTier && sourceIndex < targetIndex
        ? targetIndex - 1
        : targetIndex;
    targetArray.splice(adjustedIndex, 0, draggedPhoto);
    newTierPhotos[targetTier] = targetArray;
    setTierPhotos(newTierPhotos);
  };

  // --- 배틀 로직 ---
  const handleBattleDecision = (winnerId: string) => {
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
      const finalPlacementIndex = isNewPhotoWin
        ? battleSequence.targetIndex - battleSequence.opponents.length
        : battleSequence.targetIndex - battleSequence.currentOpponentIndex - 1;
      finalizeBattleResult(Math.max(0, finalPlacementIndex));
    }
  };

  const finalizeBattleResult = (finalIndex: number) => {
    if (!battleSequence) return;
    const { newPhoto, targetTier, sourceType } = battleSequence;

    // 소스에서 제거
    if (sourceType === "available") {
      setAvailablePhotos((prev) => prev.filter((p) => p.id !== newPhoto.id));
    } else {
      setTierPhotos((prev) => ({
        ...prev,
        [sourceType]: prev[sourceType].filter((p) => p.id !== newPhoto.id),
      }));
    }

    // 타겟에 추가
    setTierPhotos((prev) => {
      const newArray = [...(prev[targetTier] || [])];
      newArray.splice(finalIndex, 0, newPhoto);
      return { ...prev, [targetTier]: newArray };
    });

    setShowComparisonModal(false);
    setBattleSequence(null);
  };

  const handleCloseBattleModal = () => {
    setShowComparisonModal(false);
    setBattleSequence(null);
  };

  // --- 렌더링 ---
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[var(--primary-color)] font-semibold transition-colors"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" /> 앨범 목록으로 돌아가기
        </button>
        <button
          onClick={saveTierAlbumData}
          className="px-5 py-2 bg-[var(--primary-color)] text-white rounded-lg font-bold hover:bg-[#2fa692] shadow-sm hover:shadow-md transition-all"
        >
          💾 저장하기
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800">{albumTitle}</h2>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={precisionTierMode}
            onChange={(e) => setPrecisionTierMode(e.target.checked)}
          />
          <span className="font-semibold text-gray-700">
            정밀 티어 배틀 모드 활성화
          </span>
        </label>
      </div>

      <div className="space-y-3">
        {tiers.map(({ label, color }) => (
          <div
            key={label}
            className="flex bg-gray-800 rounded-lg overflow-hidden min-h-[120px] shadow-lg"
          >
            <div
              className={`w-20 flex items-center justify-center text-white text-4xl font-black bg-gradient-to-br ${color}`}
            >
              {label}
            </div>
            <div
              className="flex-1 p-3 flex flex-wrap gap-3 items-center bg-white/5"
              onDragOver={(e) => e.preventDefault()}
            >
              {(tierPhotos[label] || []).map((photo, index) => (
                <div
                  key={photo.id}
                  className="flex items-center"
                  onDragOver={(e) => handleDragOverPosition(e, label, index)}
                  onDrop={(e) => handleDropAtPosition(e, label, index)}
                >
                  {dragOverPosition?.tier === label &&
                    dragOverPosition.index === index && (
                      <div className="w-1.5 h-24 bg-teal-400 rounded-full transition-all" />
                    )}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, photo, label)}
                    onClick={() => handleImageClick(photo)}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.name}
                      width={96}
                      height={96}
                      className="rounded-md object-cover cursor-pointer w-24 h-24 shadow-md"
                    />
                  </div>
                </div>
              ))}
              <div
                className="flex-1 min-w-[24px]"
                onDragOver={(e) =>
                  handleDragOverPosition(
                    e,
                    label,
                    (tierPhotos[label] || []).length
                  )
                }
                onDrop={(e) =>
                  handleDropAtPosition(
                    e,
                    label,
                    (tierPhotos[label] || []).length
                  )
                }
              >
                {dragOverPosition?.tier === label &&
                  dragOverPosition.index ===
                    (tierPhotos[label] || []).length && (
                    <div className="w-1.5 h-24 bg-teal-400 rounded-full transition-all" />
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border">
        <h3 className="text-xl font-bold text-gray-700 mb-4">
          사용 가능한 사진
        </h3>
        <div
          onDragOver={(e) => e.preventDefault()}
          className="p-4 bg-gray-50 rounded-lg min-h-[140px] flex flex-wrap gap-3 items-center border-2 border-dashed"
        >
          {availablePhotos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo, "available")}
              onClick={() => handleImageClick(photo)}
            >
              <Image
                src={photo.src}
                alt={photo.name}
                width={96}
                height={96}
                className="rounded-md object-cover cursor-pointer w-24 h-24 shadow-sm"
              />
            </div>
          ))}
          {availablePhotos.length === 0 && (
            <p className="text-gray-400 text-sm">모든 사진이 배치되었습니다.</p>
          )}
        </div>
      </div>

      <TierBattleModal
        isOpen={showComparisonModal}
        battleSequence={battleSequence}
        onClose={handleCloseBattleModal}
        onDecision={handleBattleDecision}
      />

      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={handleCloseImageModal}
        >
          <Image
            src={selectedImage.src}
            alt={selectedImage.name}
            width={800}
            height={800}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
