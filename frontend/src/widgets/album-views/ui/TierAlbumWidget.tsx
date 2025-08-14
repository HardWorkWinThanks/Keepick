"use client";

import { useEffect } from "react";
import { Photo, DragPhotoData } from "@/entities/photo";
import {
  AlbumControls,
  AvailablePhotosPanel,
  useAlbumState,
  useAlbumStorage,
  AlbumManagementProps,
} from "@/features/album-management";
import {
  useTierGrid,
  useTierBattle,
  TierControls,
  TierGrid,
  TierBattleModal,
  TierData,
} from "@/features/tier-battle";
import { PhotoModal } from "@/features/photos-viewing";

export function TierAlbumWidget({
  albumId,
  albumTitle,
  onBack,
}: AlbumManagementProps) {
  const { saveAlbumData, loadAlbumData, getDefaultPhotos } = useAlbumStorage();
  const {
    availablePhotos,
    setAvailablePhotos,
    selectedImage,
    showImageModal,
    handleImageClick,
    handleCloseImageModal,
  } = useAlbumState();

  const {
    tierPhotos,
    setTierPhotos,
    tiers,
    dragOverPosition,
    setDragOverPosition,
    draggingPhotoId,
    setDraggingPhotoId,
    handleReturnToAvailable,
  } = useTierGrid();

  const {
    showComparisonModal,
    battleSequence,
    setBattleSequence,
    precisionTierMode,
    setPrecisionTierMode,
    handleBattleDecision,
    handleCloseBattleModal,
  } = useTierBattle();

  // 앨범 데이터 로드
  useEffect(() => {
    const result = loadAlbumData(`tier_${albumId}`);
    if (result.success && result.data) {
      setTierPhotos(
        result.data?.tierPhotos as TierData || {
          S: [],
          A: [],
          B: [],
          C: [],
          D: [],
        }
      );
      setAvailablePhotos(result.data.availablePhotos || getDefaultPhotos());
    } else {
      // 기본 데이터 설정
      setTierPhotos({
        S: [{ id: 600, src: "/presentation/target_photo", name: "S급 사진1" }  ,
             {id: 601, src: "/presentation/target_photo1", name: "S급 사진2"} ,
             {id: 602, src: "/presentation/target_photo2", name: "S급 사진3"} ,
             {id: 603, src: "/presentation/target_photo3", name: "S급 사진4"} ,
             {id: 604, src: "/presentation/target_photo4", name: "S급 사진5"} ,
             {id: 605, src: "/presentation/target_photo5", name: "S급 사진6"} ,],
        A: [],
        B: [],
        C: [],
        D: [],
      });
      setAvailablePhotos(getDefaultPhotos());
    }
  }, [albumId]);

  // 저장 핸들러
  const handleSave = () => {
    const success = saveAlbumData(
      `tier_${albumId}`,
      { tierPhotos, availablePhotos },
      tierPhotos.S?.[0]
    );

    if (success) {
      // 커버 이미지 저장
      if (tierPhotos.S?.[0]) {
        localStorage.setItem(`tierAlbumCover_${albumId}`, tierPhotos.S[0].src);
      }
      alert("✅ 티어 앨범이 성공적으로 저장되었습니다!");
      onBack();
    } else {
      alert("❌ 저장 실패");
    }
  };

  // 드래그 핸들러들
  const handleDragStart = (
    e: React.DragEvent,
    photo: Photo,
    source: string | "available"
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ photoId: photo.id, source })
    );
    setDraggingPhotoId(photo.id);
  };

  const handleDragEnd = () => {
    setDraggingPhotoId(null);
    setDragOverPosition(null);
  };

  const handleDragOverTierArea = (e: React.DragEvent, tier: string) => {
    e.preventDefault();
    setDragOverPosition({ tier, index: (tierPhotos[tier] || []).length });
  };

  const handleDropTierArea = (e: React.DragEvent, targetTier: string) => {
    e.preventDefault();
    handleDropAtPosition(e, targetTier, (tierPhotos[targetTier] || []).length);
  };

  const handleDragOverPosition = (
    e: React.DragEvent,
    tier: string,
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const isLeftHalf = mouseX < rect.width / 2;
    const targetIndex = isLeftHalf ? index : index + 1;
    setDragOverPosition({ tier, index: targetIndex });
  };

  const handleDropAtPosition = (
    e: React.DragEvent,
    targetTier: string,
    targetIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPosition(null);

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { photoId, source } = data;
    const draggedPhoto =
      source === "available"
        ? availablePhotos.find((p) => p.id === photoId)
        : tierPhotos[source]?.find((p) => p.id === photoId);

    if (!draggedPhoto) return;

    const sourceIndex =
      source !== "available"
        ? tierPhotos[source].findIndex((p) => p.id === photoId)
        : -1;

    if (
      source === targetTier &&
      (targetIndex === sourceIndex || targetIndex === sourceIndex + 1)
    )
      return;

    // 정밀 배틀 모드 체크
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
        return;
      }
    }

    // 일반 드롭 처리
    setTierPhotos((prev) => {
      const newTiers = { ...prev };
      if (source === "available") {
        setAvailablePhotos((p) => p.filter((p) => p.id !== photoId));
      } else {
        newTiers[source] = [...(newTiers[source] || [])].filter(
          (p) => p.id !== photoId
        );
      }
      const targetArray = [...(newTiers[targetTier] || [])];
      targetArray.splice(targetIndex, 0, draggedPhoto);
      newTiers[targetTier] = targetArray;
      return newTiers;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AlbumControls albumTitle={albumTitle} onBack={onBack}>
        <TierControls
          precisionTierMode={precisionTierMode}
          onPrecisionModeToggle={() => setPrecisionTierMode(!precisionTierMode)}
          onSave={handleSave}
        />
      </AlbumControls>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <TierGrid
          tiers={tiers}
          tierPhotos={tierPhotos}
          dragOverPosition={dragOverPosition}
          draggingPhotoId={draggingPhotoId}
          onImageClick={handleImageClick}
          onReturnToAvailable={(photoId, fromTier) =>
            handleReturnToAvailable(photoId, fromTier, (photo) =>
              setAvailablePhotos((prev) => [...prev, photo])
            )
          }
          onDragOverTierArea={handleDragOverTierArea}
          onDropTierArea={handleDropTierArea}
          onDragOverPosition={handleDragOverPosition}
          onDropAtPosition={handleDropAtPosition}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />

        <AvailablePhotosPanel
          photos={availablePhotos}
          onPhotoClick={handleImageClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggingPhotoId={draggingPhotoId}
        />
      </div>

      <TierBattleModal
        isOpen={showComparisonModal}
        battleSequence={battleSequence}
        onClose={handleCloseBattleModal}
        onDecision={(winnerId) =>
          handleBattleDecision(winnerId, tierPhotos, setTierPhotos, (photoId) =>
            setAvailablePhotos((prev) => prev.filter((p) => p.id !== photoId))
          )
        }
        onZoomRequest={handleImageClick}
      />

      <PhotoModal
        photo={selectedImage}
        isOpen={showImageModal}
        onClose={handleCloseImageModal}
      />
    </div>
  );
}
