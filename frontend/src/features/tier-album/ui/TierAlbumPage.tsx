"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useTierAlbum } from "../model/useTierAlbum"
import type { TierInfo, TierType } from "../types"
import { Photo, DragPhotoData } from "@/entities/photo"
import { TIER_COLORS } from "@/shared/config/tierColors"
import {
  useAlbumState,
  useAlbumStorage,
} from "@/features/album-management"
import {
  useTierGrid,
  useTierBattle,
  TierGrid,
  TierBattleModal,
  TierData,
} from "@/features/tier-battle"
import { PhotoModal } from "@/features/photos-viewing"
import { DraggablePhotoGrid } from "@/features/photo-drag-drop"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"

interface TierAlbumPageProps {
  groupId: string
  albumId: string
}

// 티어 정보
const tiers: TierInfo[] = [
  { id: "S", name: "S", color: TIER_COLORS.S },
  { id: "A", name: "A", color: TIER_COLORS.A },
  { id: "B", name: "B", color: TIER_COLORS.B },
  { id: "C", name: "C", color: TIER_COLORS.C },
  { id: "D", name: "D", color: TIER_COLORS.D },
]

// Tilt Shine Card 컴포넌트
interface TiltShineCardProps {
  children: React.ReactNode
  tierColor: string
  className?: string
}

const TiltShineCard: React.FC<TiltShineCardProps> = ({ children, tierColor, className = "" }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [shine, setShine] = useState({ x: 50, y: 50 })
  const rafRef = useRef<number | undefined>(undefined)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!wrapperRef.current) return
    
    // 애니메이션 프레임 최적화
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const tiltX = (e.clientY - cy) / 15 // 감도 줄임
      const tiltY = (cx - e.clientX) / 15 // 감도 줄임
      const shineX = ((e.clientX - rect.left) / rect.width) * 100
      const shineY = ((e.clientY - rect.top) / rect.height) * 100
      setTilt({ x: Math.max(-10, Math.min(10, tiltX)), y: Math.max(-10, Math.min(10, tiltY)) }) // 각도 제한 줄임
      setShine({ x: shineX, y: shineY })
    })
  }

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setTilt({ x: 0, y: 0 })
    setShine({ x: 50, y: 50 })
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 카드 본체 */}
      <div className="relative rounded-lg overflow-hidden shadow-2xl cursor-pointer bg-black">
        {/* Shine (스팟 하이라이트) - 성능 최적화 */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-20 rounded-lg"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.6) 0%, transparent 40%)`,
            transition: shine.x === 50 && shine.y === 50 ? "background 0.4s ease-out" : "none",
          }}
        />

        {/* 추가 글로우 (부드러운 색 번짐) - 성능 최적화 */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none z-20 rounded-lg"
          style={{
            background: `linear-gradient(45deg, transparent 35%, ${tierColor}15 50%, transparent 65%)`,
            transform: `translateX(${(shine.x - 50) / 3}px) translateY(${(shine.y - 50) / 3}px)`,
            transition: shine.x === 50 && shine.y === 50 ? "transform 0.4s ease-out" : "none",
          }}
        />

        {children}
      </div>
    </div>
  )
}

export default function TierAlbumPage({ groupId, albumId }: TierAlbumPageProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  
  const {
    isLoading,
    currentTier,
    currentPhotoIndex,
    currentTierPhotos,
    currentPhoto,
    setCurrentTier,
    getTierCount,
    goToPrevPhoto,
    goToNextPhoto,
    goToPhoto,
  } = useTierAlbum(groupId, albumId)

  // TierAlbumWidget 로직 추가
  const { saveAlbumData, loadAlbumData, getDefaultPhotos } = useAlbumStorage()
  const {
    availablePhotos,
    setAvailablePhotos,
    selectedImage,
    showImageModal,
    handleImageClick,
    handleCloseImageModal,
  } = useAlbumState()

  const {
    tierPhotos,
    setTierPhotos,
    tiers: battleTiers,
    dragOverPosition,
    setDragOverPosition,
    draggingPhotoId,
    setDraggingPhotoId,
    handleReturnToAvailable,
  } = useTierGrid()

  const {
    showComparisonModal,
    battleSequence,
    setBattleSequence,
    precisionTierMode,
    setPrecisionTierMode,
    handleBattleDecision,
    handleCloseBattleModal,
  } = useTierBattle()

  const currentTierInfo = tiers.find((tier) => tier.id === currentTier)!

  // 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  // TierAlbumWidget 로직 - 앨범 데이터 로드
  useEffect(() => {
    if (isEditMode) {
      const result = loadAlbumData(`tier_${albumId}`)
      if (result.success && result.data) {
        setTierPhotos(
          result.data?.tierPhotos as TierData || {
            S: [{ id: "photo_s1", src: "/jaewan1.jpg", name: "S급 사진1" }],
            A: [],
            B: [],
            C: [],
            D: [],
          }
        )
        setAvailablePhotos(result.data.availablePhotos || getDefaultPhotos())
      } else {
        // 기본 데이터 설정
        setTierPhotos({
          S: [{ id: "photo_s1", src: "/jaewan1.jpg", name: "S급 사진1" }],
          A: [],
          B: [],
          C: [],
          D: [],
        })
        setAvailablePhotos(getDefaultPhotos())
      }
    }
  }, [albumId, isEditMode])

  // 저장 핸들러
  const handleSave = () => {
    const success = saveAlbumData(
      `tier_${albumId}`,
      { tierPhotos, availablePhotos },
      tierPhotos.S?.[0]
    )

    if (success) {
      // 커버 이미지 저장
      if (tierPhotos.S?.[0]) {
        localStorage.setItem(`tierAlbumCover_${albumId}`, tierPhotos.S[0].src)
      }
      alert("✅ 티어 앨범이 성공적으로 저장되었습니다!")
      setIsEditMode(false)
    } else {
      alert("❌ 저장 실패")
    }
  }

  // 드래그 핸들러들 (tier-battle의 형식에 맞게 수정)
  const handleDragStart = (
    e: React.DragEvent,
    photo: Photo,
    source: string | "available"
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ photoId: photo.id, source })
    )
    setDraggingPhotoId(photo.id)
  }

  const handleDragEnd = () => {
    setDraggingPhotoId(null)
    setDragOverPosition(null)
  }

  // 사용가능한 사진용 드래그 핸들러 (useTierGrid의 setDraggingPhotoId 사용)
  const handleAvailablePhotoDragStart = (_: React.DragEvent<HTMLDivElement>, photo: Photo) => {
    setDraggingPhotoId(photo.id)
  }

  const handleAvailablePhotoDragEnd = () => {
    setDraggingPhotoId(null)
  }

  const handleDragOverTierArea = (e: React.DragEvent, tier: string) => {
    e.preventDefault()
    setDragOverPosition({ tier, index: (tierPhotos[tier] || []).length })
  }

  const handleDropTierArea = (e: React.DragEvent, targetTier: string) => {
    e.preventDefault()
    handleDropAtPosition(e, targetTier, (tierPhotos[targetTier] || []).length)
  }

  const handleDragOverPosition = (
    e: React.DragEvent,
    tier: string,
    index: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const isLeftHalf = mouseX < rect.width / 2
    const targetIndex = isLeftHalf ? index : index + 1
    setDragOverPosition({ tier, index: targetIndex })
  }

  const handleDropAtPosition = (
    e: React.DragEvent,
    targetTier: string,
    targetIndex: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPosition(null)

    const data = JSON.parse(e.dataTransfer.getData("text/plain"))
    const { photoId, source } = data
    const draggedPhoto =
      source === "available"
        ? availablePhotos.find((p) => p.id === photoId)
        : tierPhotos[source]?.find((p) => p.id === photoId)

    if (!draggedPhoto) return

    const sourceIndex =
      source !== "available"
        ? tierPhotos[source].findIndex((p) => p.id === photoId)
        : -1

    if (
      source === targetTier &&
      (targetIndex === sourceIndex || targetIndex === sourceIndex + 1)
    )
      return

    // 정밀 배틀 모드 체크
    if (
      precisionTierMode &&
      tierPhotos[targetTier]?.length > 0 &&
      source !== targetTier
    ) {
      const opponents = [...tierPhotos[targetTier]]
        .slice(0, targetIndex)
        .reverse()
      if (opponents.length > 0) {
        setBattleSequence({
          newPhoto: draggedPhoto,
          opponents,
          currentOpponentIndex: 0,
          targetTier,
          targetIndex,
          sourceType: source as "available" | string, // 타입 수정
        })
        setShowComparisonModal(true) // 배틀 모달 열기
        return
      }
    }

    // 일반 드롭 처리
    setTierPhotos((prev) => {
      const newTiers = { ...prev }
      if (source === "available") {
        setAvailablePhotos((p) => p.filter((p) => p.id !== photoId))
      } else {
        newTiers[source] = [...(newTiers[source] || [])].filter(
          (p) => p.id !== photoId
        )
      }
      const targetArray = [...(newTiers[targetTier] || [])]
      targetArray.splice(targetIndex, 0, draggedPhoto)
      newTiers[targetTier] = targetArray
      return newTiers
    })
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">티어 앨범을 불러오는 중...</div>
          <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${currentTierInfo.color}40 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${currentTierInfo.color}20 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Header - timeline-album 헤더와 통합된 스타일 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href={`/group/${groupId}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={20} />
            <span className="font-keepick-primary text-sm">돌아가기</span>
          </Link>
          <div className="text-center">
            <h1 className="font-keepick-heavy text-xl tracking-wider">TIER ALBUM {albumId}</h1>
          </div>
          <button 
            onClick={toggleEditMode}
            className="px-6 py-2 border-2 border-orange-500 hover:border-orange-400 text-orange-500 hover:text-orange-400 bg-transparent font-keepick-primary text-sm rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
          >
            {isEditMode ? "티어 완성하기" : "티어 수정하기"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${isEditMode ? 'min-h-screen bg-[#111111] pt-20' : 'h-screen flex flex-col pt-16'} relative z-10`}>
        {isEditMode ? (
          // 편집 모드 - 사이드바 레이아웃
          <div className="flex gap-6 animate-fade-in pb-8 px-8 h-screen">
            {/* 좌측: 사용가능한 사진 사이드바 */}
            <div className="w-80 flex-shrink-0 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-keepick-heavy text-white">티어 편집</h2>
                <button
                  onClick={() => setPrecisionTierMode(!precisionTierMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 ${
                    precisionTierMode
                      ? "bg-[#FE7A25] text-white ring-2 ring-[#FE7A25]"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm">
                    {precisionTierMode ? "배틀" : "배틀"}
                  </span>
                </button>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium text-gray-300">사용가능한 사진</h3>
                  <span className="text-xs text-gray-500">{availablePhotos.length}장</span>
                </div>
                
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <DraggablePhotoGrid
                    photos={availablePhotos}
                    onDragStart={handleAvailablePhotoDragStart}
                    onDragEnd={handleAvailablePhotoDragEnd}
                    draggingPhotoId={draggingPhotoId}
                    sourceId="available"
                    gridClassName="grid grid-cols-3 gap-2 pb-2"
                    photoClassName="aspect-square w-full object-cover rounded shadow-sm hover:scale-105 transition-transform cursor-grab"
                  />
                </ScrollArea>
              </div>

              {/* 사용방법 */}
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="space-y-1 text-xs text-gray-400">
                  <div>• 사진을 드래그해서 티어로 이동</div>
                  <div>• 정밀 배틀 모드로 순위 결정</div>
                  <div>• 티어 내에서 순서 조정 가능</div>
                </div>
              </div>
            </div>

            {/* 우측: 티어 그리드 */}
            <div className="flex-1">
              <TierGrid
                tiers={battleTiers}
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
        ) : (
          // 뷰 모드 - 기존 티어 앨범 뷰어
          <>
        {/* Left Top: Tier Title & Navigation */}
        <div className="absolute top-24 left-8 z-40">
          {/* Large Tier Character with "Tier" text */}
          <div className="flex items-baseline gap-3 mb-4">
            <motion.h1
              key={currentTier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-8xl md:text-9xl font-keepick-heavy tracking-wider"
              style={{ color: currentTierInfo.color }}
            >
              {currentTier}
            </motion.h1>
            <span
              className="text-2xl font-keepick-heavy tracking-widest opacity-80"
              style={{
                color: currentTierInfo.color,
                textShadow: `0 0 10px ${currentTierInfo.color}40`,
              }}
            >
              TIER
            </span>
          </div>

          <div className="mb-4">
            <p className="font-keepick-primary text-gray-400 text-sm mb-1">
              {currentTier === "S" && "최고의 순간들"}
              {currentTier === "A" && "특별한 기억들"}
              {currentTier === "B" && "좋은 추억들"}
              {currentTier === "C" && "일상의 모습들"}
              {currentTier === "D" && "아쉬운 사진들"}
            </p>
            <p className="font-keepick-primary text-gray-500 text-xs">{getTierCount(currentTier)}장의 사진</p>
          </div>

          {/* Minimal Tier Navigation */}
          <div className="flex gap-2 mb-6">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setCurrentTier(tier.id)}
                className={`w-8 h-8 rounded-full text-sm font-keepick-heavy transition-all duration-300 relative ${
                  currentTier === tier.id
                    ? "text-black"
                    : "text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500"
                }`}
                style={{
                  backgroundColor: currentTier === tier.id ? tier.color : "transparent",
                }}
              >
                {tier.name}
              </button>
            ))}
          </div>

          {/* Tier Distribution Bar Chart */}
          <div className="max-w-xs">
            <p className="font-keepick-primary text-xs text-gray-500 mb-2">티어별 분포</p>
            <div className="space-y-1">
              {tiers.map((tier) => {
                const count = getTierCount(tier.id)
                const percentage = (count / 23) * 100 // 전체 사진 수
                return (
                  <div key={tier.id} className="flex items-center gap-2">
                    <span className="font-keepick-primary text-xs w-4" style={{ color: tier.color }}>
                      {tier.name}
                    </span>
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: tier.color,
                        }}
                      />
                    </div>
                    <span className="font-keepick-primary text-xs text-gray-500 w-6">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {currentTierPhotos.length > 0 && (
          <div className="absolute top-24 right-8 z-40">
            <motion.div
              key={`${currentTier}-${currentPhotoIndex}-info`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 w-48"
            >
              <h3 className="font-keepick-heavy text-base mb-2" style={{ color: currentTierInfo.color }}>
                사진 #{currentPhotoIndex + 1}
              </h3>
              <p className="font-keepick-primary text-gray-400 text-xs mb-3">{currentPhoto.date}</p>

              <div className="space-y-1.5 text-xs font-keepick-primary text-gray-500">
                <div className="flex justify-between">
                  <span>등급</span>
                  <span style={{ color: currentTierInfo.color }}>{currentTier}급</span>
                </div>
                <div className="flex justify-between">
                  <span>순서</span>
                  <span>
                    {currentPhotoIndex + 1} / {currentTierPhotos.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>전체</span>
                  <span>23장 중</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modern Carousel with Tilt Shine Card */}
        <div className="flex-1 relative flex items-center justify-center">
          {currentTierPhotos.length > 0 && (
            <>
              {/* Main Photo with Tilt Shine Effect */}
              <motion.div
                key={`${currentTier}-${currentPhotoIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative"
              >
                <TiltShineCard tierColor={currentTierInfo.color} className="max-w-4xl max-h-[70vh]">
                  <img
                    src={currentPhoto.src || "/placeholder.svg"}
                    alt={currentPhoto.title}
                    className="w-full h-full object-contain max-w-4xl max-h-[70vh]"
                    draggable={false}
                  />
                </TiltShineCard>
              </motion.div>

              {/* Navigation Arrows */}
              {currentTierPhotos.length > 1 && (
                <>
                  <button
                    onClick={goToPrevPhoto}
                    className="absolute left-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-30"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button
                    onClick={goToNextPhoto}
                    className="absolute right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-30"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Bottom: Small Thumbnail Strip */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            {currentTierPhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => goToPhoto(index)}
                className={`w-12 h-12 rounded overflow-hidden transition-all duration-300 relative ${
                  index === currentPhotoIndex ? "ring-2 scale-110" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  "--tw-ring-color": index === currentPhotoIndex ? currentTierInfo.color : "transparent",
                } as React.CSSProperties}
              >
                <img src={photo.src || "/placeholder.svg"} alt={photo.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-keepick-primary text-xs text-white">{index + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Counter - Bottom Right */}
        {currentTierPhotos.length > 0 && (
          <div className="absolute bottom-8 right-8">
            <p className="font-keepick-primary text-gray-400 text-sm">
              {currentPhotoIndex + 1} / {currentTierPhotos.length}
            </p>
          </div>
        )}

        {/* Empty State */}
        {currentTierPhotos.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="font-keepick-primary text-gray-400 text-lg mb-4">{currentTierInfo.name}등급에 사진이 없습니다</p>
              <Link href="/gallery" className="font-keepick-primary text-orange-500 hover:text-orange-400 transition-colors">
                갤러리에서 선택하기
              </Link>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  )
}