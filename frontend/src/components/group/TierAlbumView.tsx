// components/group/TierAlbumView.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import TierBattleModal from "./TierBattleModal"; // 분리된 배틀 모달 import
import { TrophyIcon } from "@heroicons/react/24/solid";
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
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);

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
    setDraggingPhotoId(photo.id); // [개선] 드래그 시작 시 ID 설정
  };
  const handleDragEnd = () => setDraggingPhotoId(null);
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
    <div className="space-y-4 animate-fade-in">
      {/* [개선] 1. 상단 컨트롤 바: 모든 제어 기능을 한 곳으로 통합 */}
      <div className="flex items-center justify-between gap-4 mb-4 p-4 bg-white rounded-xl shadow-md border">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowUturnLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 truncate">
            {albumTitle}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={precisionTierMode}
              onChange={(e) => setPrecisionTierMode(e.target.checked)}
            />
            <span className="font-semibold text-sm text-gray-700 hidden sm:block">
              배틀 모드
            </span>
          </label>
          <button
            onClick={saveTierAlbumData}
            className="px-5 py-2 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 shadow-sm transition-all"
          >
            저장
          </button>
        </div>
      </div>

      {/* [개선] 2. 컴팩트한 티어 목록 레이아웃 */}
      <div className="bg-gray-800 rounded-xl shadow-lg p-4 space-y-1">
        {tiers.map(({ label, color }) => (
          <div
            key={label}
            className={`flex items-stretch min-h-[112px] rounded-md transition-colors ${
              dragOverPosition?.tier === label ? "bg-white/10" : ""
            }`}
            onDragOver={(e) => e.preventDefault()}
          >
            <div
              className={`w-16 flex items-center justify-center text-white text-3xl font-black rounded-l-md bg-gradient-to-br ${color}`}
            >
              {label}
            </div>
            <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
              {(tierPhotos[label] || []).map((photo, index) => (
                <div
                  key={photo.id}
                  className="flex items-center"
                  onDragOver={(e) => handleDragOverPosition(e, label, index)}
                  onDrop={(e) => handleDropAtPosition(e, label, index)}
                >
                  {dragOverPosition?.tier === label &&
                    dragOverPosition.index === index && (
                      <div className="w-1 h-20 bg-teal-400 rounded-full transition-all" />
                    )}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, photo, label)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleImageClick(photo)}
                    className={`relative group transition-opacity ${
                      draggingPhotoId === photo.id
                        ? "opacity-40"
                        : "opacity-100"
                    }`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.name}
                      width={88}
                      height={88}
                      className="rounded-md object-cover cursor-pointer w-22 h-22 shadow-md hover:scale-105 transition-transform"
                    />
                    {label === "S" && index === 0 && (
                      <TrophyIcon className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 filter drop-shadow-lg" />
                    )}
                  </div>
                </div>
              ))}
              <div
                className="flex-1 min-w-[20px]"
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
                    <div className="w-1 h-20 bg-teal-400 rounded-full" />
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
          className="p-4 bg-gray-50 rounded-lg min-h-[120px] flex flex-wrap gap-3 items-center border-2 border-dashed"
        >
          {availablePhotos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo, "available")}
              onDragEnd={handleDragEnd}
              onClick={() => handleImageClick(photo)}
              className={`transition-opacity ${
                draggingPhotoId === photo.id ? "opacity-40" : "opacity-100"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.name}
                width={88}
                height={88}
                className="rounded-md object-cover cursor-pointer w-22 h-22 shadow-sm"
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
