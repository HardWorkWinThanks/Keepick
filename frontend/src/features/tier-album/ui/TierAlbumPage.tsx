"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { getPhotoPlaceholder } from "@/shared/constants/placeholders"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, Check, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTierEditor } from "../model/useTierEditor"
import { useTierAlbum } from "../model/useTierAlbum"
import type { TierInfo, TierType } from "../types"
import { Photo, DragPhotoData } from "@/entities/photo"
import { TIER_COLORS } from "@/shared/config/tierColors"
import { AlbumInfoEditModal, type EditingAlbumInfo } from "@/shared/ui/modal/AlbumInfoEditModal"
import {
  useTierBattle,
  TierGrid,
  TierBattleModal,
  TierData,
} from "@/features/tier-battle"
import { PhotoModal, usePhotoModal } from "@/features/photos-viewing"

interface TierAlbumPageProps {
  groupId: string
  tierAlbumId: string
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

export default function TierAlbumPage({ groupId, tierAlbumId }: TierAlbumPageProps) {
  const searchParams = useSearchParams()
  
  // 통합 편집 훅 (상태 관리 통합)
  const {
    // 기본 상태
    isLoading,
    error,
    tierAlbumData,
    
    // 편집 상태
    isEditMode,
    tierPhotos,
    setTierPhotos,
    availablePhotos,
    setAvailablePhotos,
    
    // 앨범 정보
    albumInfo,
    coverImage,
    setCoverImage,
    
    // 드래그&드롭 상태
    dragOverPosition,
    setDragOverPosition,
    draggingPhotoId,
    setDraggingPhotoId,
    
    // 설정
    tiers: battleTiers,
    
    // 액션들
    toggleEditMode,
    saveChanges,
    addPhotosFromGallery,
    deletePhotos,
    updateAlbumInfo,
    
    // 드래그&드롭 핸들러들
    handleDragStart,
    handleDragEnd,
    handleDragOverTierArea,
    handleDragOverPosition,
    handleDropAtPosition,
    handleDropTierArea,
    handleSidebarDrop,
    moveTierToSidebar,
    moveSidebarToTier,
  } = useTierEditor(groupId, tierAlbumId)

  // 뷰 모드용 훅 (기존 로직 유지)
  const {
    photos: tierAlbumPhotos,
    currentTier,
    currentPhotoIndex,
    currentTierPhotos,
    currentPhoto,
    setCurrentTier,
    getTierCount,
    goToPrevPhoto,
    goToNextPhoto,
    goToPhoto,
  } = useTierAlbum(groupId, tierAlbumId)

  // 배틀 모드 훅
  const {
    showComparisonModal,
    setShowComparisonModal,
    battleSequence,
    setBattleSequence,
    precisionTierMode,
    setPrecisionTierMode,
    handleBattleDecision,
    handleCloseBattleModal,
  } = useTierBattle()

  // 사진 모달 훅
  const { photo: selectedModalPhoto, isOpen: isPhotoModalOpen, openModal: openPhotoModal, closeModal: closePhotoModal } = usePhotoModal()
  
  // 모달 상태
  const [isAlbumInfoModalOpen, setIsAlbumInfoModalOpen] = useState(false)

  const currentTierInfo = tiers.find((tier) => tier.id === currentTier)!
  
  // URL 파라미터에서 편집 모드 확인하여 자동 진입 (갤러리에서 돌아온 경우만)
  useEffect(() => {
    const editParam = searchParams.get('edit')
    const fromParam = searchParams.get('from')
    
    // 갤러리에서 돌아온 경우에만 편집 모드로 진입
    if (editParam === 'true' && fromParam === 'gallery' && !isEditMode) {
      toggleEditMode()
      
      // URL에서 from=gallery 파라미터 제거 (한 번만 처리되도록)
      const url = new URL(window.location.href)
      url.searchParams.delete('from')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, isEditMode, toggleEditMode])
  
  // 편집 모드 변경 시 URL 업데이트
  useEffect(() => {
    const url = new URL(window.location.href)
    if (isEditMode) {
      url.searchParams.set('edit', 'true')
    } else {
      url.searchParams.delete('edit')
    }
    window.history.replaceState({}, '', url.toString())
  }, [isEditMode])
  
  // 사이드바 이벤트 처리 (간소화 - useTierEditor에서 대부분 처리)
  useEffect(() => {
    const handlePhotosDeleteRequest = (event: CustomEvent) => {
      const photoIds = event.detail
      deletePhotos(photoIds).catch(error => {
        console.error('사진 삭제 실패:', error)
        alert('사진 삭제에 실패했습니다. 다시 시도해주세요.')
      })
    }
    
    window.addEventListener('tierPhotosDeleteRequest', handlePhotosDeleteRequest as EventListener)
    
    return () => {
      window.removeEventListener('tierPhotosDeleteRequest', handlePhotosDeleteRequest as EventListener)
    }
  }, [deletePhotos])

  // 앨범 정보 업데이트 핸들러
  const handleAlbumInfoUpdate = (updates: Partial<EditingAlbumInfo>) => {
    updateAlbumInfo(updates)
  }

  // 티어에서 사용 가능한 사진으로 되돌리는 핸들러 (useTierEditor의 moveTierToSidebar 사용)
  const handleReturnToAvailable = (
    photoId: number,
    fromTier: string,
    onReturn?: (photo: Photo) => void
  ) => {
    const photo = tierPhotos[fromTier]?.find((p) => p.id === photoId)
    if (photo) {
      moveTierToSidebar(photo, fromTier)
      // 기존 콜백이 있다면 호출 (대표이미지 설정 등)
      onReturn?.(photo)
    }
  }

  // 대표이미지 설정 핸들러
  const handleCoverImageDrop = (dragData: DragPhotoData) => {
    const photo: Photo = {
      id: dragData.photoId,
      originalUrl: dragData.originalUrl || '/placeholder/photo-placeholder.svg',
      thumbnailUrl: dragData.thumbnailUrl || '/placeholder/photo-placeholder.svg',
      name: dragData.name || `사진 #${dragData.photoId}`
    }
    setCoverImage(photo)
    
    // 티어에서 온 사진인 경우 해당 티어에서 제거 (타임라인 방식)
    if (dragData.source !== "available" && dragData.source !== "cover-image") {
      handleReturnToAvailable(dragData.photoId, dragData.source)
    }
  }

  // 대표이미지 제거 핸들러
  const handleCoverImageRemove = (dragData: DragPhotoData) => {
    setCoverImage(null)
    // 사용가능한 사진 목록에 추가
    const photo: Photo = {
      id: dragData.photoId,
      originalUrl: dragData.originalUrl || '/placeholder/photo-placeholder.svg',
      thumbnailUrl: dragData.thumbnailUrl || '/placeholder/photo-placeholder.svg',
      name: dragData.name || `사진 #${dragData.photoId}`
    }
    setAvailablePhotos((prev) => [...prev, photo])
  }

  // 사이드바 드롭은 useTierEditor의 handleSidebarDrop 사용

  // 드래그 핸들러들은 useTierEditor에서 제공

  // 사용가능한 사진용 드래그 핸들러들도 useTierEditor에서 제공

  // 정밀 배틀 모드를 고려한 드롭 핸들러 래퍼
  const handleDropAtPositionWithBattle = useCallback((
    e: React.DragEvent,
    targetTier: string,
    targetIndex: number
  ) => {
    e.preventDefault()
    e.stopPropagation()

    // 드래그 데이터 검증을 위해 임시로 파싱
    try {
      const dragDataString = e.dataTransfer.getData("text/plain")
      if (!dragDataString) return
      
      const dragData = JSON.parse(dragDataString)
      const { photoId, source } = dragData
      
      // 드래그된 사진 찾기
      const draggedPhoto = source === "available"
        ? availablePhotos.find(p => p.id === photoId)
        : tierPhotos[source]?.find(p => p.id === photoId)

      if (!draggedPhoto) return

      // 정밀 배틀 모드 체크
      if (precisionTierMode && tierPhotos[targetTier]?.length > 0) {
        // 같은 티어 내에서는 드래그하는 사진을 제외한 상대들만 고려
        const availableOpponents = source === targetTier 
          ? [...tierPhotos[targetTier]].filter(p => p.id !== draggedPhoto.id)
          : [...tierPhotos[targetTier]]
        
        const opponents = availableOpponents
          .slice(0, source === targetTier ? Math.min(targetIndex, availableOpponents.length) : targetIndex)
          .reverse()
        
        if (opponents.length > 0) {
          setBattleSequence({
            newPhoto: draggedPhoto,
            opponents,
            currentOpponentIndex: 0,
            targetTier,
            targetIndex,
            sourceType: source as "available" | string,
          })
          setShowComparisonModal(true)
          return
        }
      }

      // 일반 드롭 처리 (useTierEditor 함수 사용)
      handleDropAtPosition(e, targetTier, targetIndex)
      
    } catch (error) {
      console.error('정밀 배틀 모드 체크 실패:', error)
      // 에러 발생 시 일반 드롭 처리로 fallback
      handleDropAtPosition(e, targetTier, targetIndex)
    }
  }, [
    availablePhotos, 
    tierPhotos, 
    precisionTierMode, 
    setBattleSequence, 
    setShowComparisonModal, 
    handleDropAtPosition
  ])

  const handleDropTierAreaWithBattle = useCallback((e: React.DragEvent, targetTier: string) => {
    const tierLength = (tierPhotos[targetTier] || []).length
    handleDropAtPositionWithBattle(e, targetTier, tierLength)
  }, [tierPhotos, handleDropAtPositionWithBattle])
  
  // 갤러리에서 사진 추가 핸들러
  const handleAddPhotos = () => {
    addPhotosFromGallery()
  }
  
  // 사진 삭제 핸들러
  const handleDeletePhotos = async (photoIds: number[]) => {
    deletePhotos(photoIds).catch(error => {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.')
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

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4 text-red-400">티어 앨범을 불러올 수 없습니다</div>
          <div className="text-gray-400 mb-4">앨범이 존재하지 않거나 접근 권한이 없습니다.</div>
          <Link href={`/group/${groupId}?album=tier`} className="text-[#FE7A25] hover:text-orange-400 font-keepick-primary">
            그룹으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="min-h-screen bg-[#111111] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, ${currentTierInfo.color}40 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${currentTierInfo.color}20 0%, transparent 50%)`,
            }}
          />
        </div>

        {/* Header - 편집/뷰 모드 공통 */}
        <header className="fixed top-0 right-0 z-40 bg-[#111111] border-b border-gray-800 transition-all duration-200"
                style={{ left: '240px', width: 'calc(100% - 240px)' }}>
          <div className="relative flex items-center py-2 px-8">
            {/* 왼쪽 영역 - 고정 너비 */}
            <div className="flex items-center" style={{ width: '200px' }}>
              {isEditMode ? (
                <button
                  onClick={toggleEditMode}
                  className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                  <ArrowLeft size={20} />
                  <span className="font-keepick-primary text-sm">돌아가기</span>
                </button>
              ) : (
                <Link 
                  href={`/group/${groupId}?album=tier`} 
                  className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                  <ArrowLeft size={20} />
                  <span className="font-keepick-primary text-sm">돌아가기</span>
                </Link>
              )}
            </div>
            
            {/* 중앙 영역 - 제목 */}
            <div className="flex-1 text-center">
              <h1 className="font-keepick-heavy text-lg tracking-wider">
                {tierAlbumData?.title || `TIER ALBUM ${tierAlbumId}`}
              </h1>
            </div>
            
            {/* 오른쪽 영역 - 버튼들 */}
            <div className="flex gap-2 ml-auto">
              {/* 앨범 정보 수정 버튼 - 편집 모드일 때만 표시 */}
              {isEditMode && (
                <button
                  onClick={() => setIsAlbumInfoModalOpen(true)}
                  className="group relative px-4 py-2 text-white hover:text-blue-400 transition-all duration-300"
                  title="앨범 정보 수정"
                >
                  <div className="flex items-center gap-2">
                    <Edit size={16} />
                    <span className="font-keepick-primary text-sm tracking-wide">앨범 정보</span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></div>
                </button>
              )}
              
              {/* 편집/완료 버튼 */}
              <button 
                onClick={isEditMode ? saveChanges : toggleEditMode}
                className={`group relative px-4 py-2 text-white transition-all duration-300 ${
                  isEditMode
                    ? 'hover:text-green-400'
                    : 'hover:text-[#FE7A25]'
                }`}
                title={isEditMode ? '편집 완료' : '티어 편집'}
              >
                <div className="flex items-center gap-2">
                  {isEditMode ? <Check size={16} /> : <Settings size={16} />}
                  <span className="font-keepick-primary text-sm tracking-wide">
                    {isEditMode ? "티어 완성하기" : "티어 수정하기"}
                  </span>
                </div>
                <div className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isEditMode ? 'bg-green-400' : 'bg-[#FE7A25]'
                }`}></div>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`${isEditMode ? 'min-h-screen bg-[#111111] pt-16' : 'h-screen flex flex-col pt-16'} relative z-10`}>
          {isEditMode ? (
            // 편집 모드 - 티어 그리드 레이아웃 (사이드바는 AppLayout에서 관리)
            <div className="flex gap-6 animate-fade-in pb-8 px-8 h-screen">
              {/* 티어 그리드 */}
              <div className="flex-1">
                {/* 메인 섹션 헤더 */}
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-4xl font-keepick-heavy text-white tracking-wider">TIER BATTLE</h1>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400 whitespace-nowrap">
                      <div>• 드래그로 순위 결정</div>
                      <div>• 정밀배틀: 1대1 토너먼트로 정확한 순위</div>
                    </div>
                    <button
                      onClick={() => setPrecisionTierMode(!precisionTierMode)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        precisionTierMode
                          ? "bg-[#FE7A25] text-white ring-2 ring-[#FE7A25]"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm">
                        정밀배틀 {precisionTierMode ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                </div>
                
                <TierGrid
                  tiers={battleTiers}
                  tierPhotos={tierPhotos}
                  dragOverPosition={dragOverPosition}
                  draggingPhotoId={draggingPhotoId}
                  onReturnToAvailable={(photoId, fromTier) =>
                    handleReturnToAvailable(photoId, fromTier)
                  }
                  onDragOverTierArea={handleDragOverTierArea}
                  onDropTierArea={handleDropTierAreaWithBattle}
                  onDragOverPosition={handleDragOverPosition}
                  onDropAtPosition={handleDropAtPositionWithBattle}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onImageClick={openPhotoModal}
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
                onZoomRequest={openPhotoModal}
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
          {/* <div className="max-w-xs">
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
          </div> */}
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
              <p className="font-keepick-primary text-gray-400 text-xs mb-3">{currentPhoto?.date || '날짜 정보 없음'}</p>

              <div className="space-y-1.5 text-xs font-keepick-primary text-gray-500">
                <div className="flex justify-between">
                  <span>등급</span>
                  <span style={{ color: currentTierInfo.color }}>{currentTier}</span>
                </div>
                <div className="flex justify-between">
                  <span>순위</span>
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
                    src={currentPhoto.originalUrl || getPhotoPlaceholder()}
                    alt={currentPhoto.name || `Photo ${currentPhoto.id}`}
                    className="w-full h-full object-contain max-w-4xl max-h-[70vh]"
                    draggable={false}
                  />
                </TiltShineCard>
              </motion.div>

              {/* Navigation Arrows */}
              {tierAlbumPhotos.length > 1 && (
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
                <Image 
                  src={photo.thumbnailUrl || getPhotoPlaceholder()} 
                  alt={photo.name || `Photo ${photo.id}`} 
                  width={48}
                  height={48}
                  sizes="48px"
                  className="w-full h-full object-cover" 
                />
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
              <p className="font-keepick-primary text-gray-400 text-lg">{currentTierInfo.name}등급에 사진이 없습니다</p>
            </div>
          </div>
        )}
          </>
        )}
      </main>

        {/* 앨범 정보 수정 모달 */}
        <AlbumInfoEditModal
          isOpen={isAlbumInfoModalOpen}
          onClose={() => setIsAlbumInfoModalOpen(false)}
          albumInfo={albumInfo}
          onAlbumInfoUpdate={handleAlbumInfoUpdate}
          showDateInputs={false}
          title="티어 앨범 정보 수정"
          albumType="tier"
          onSave={async () => {
            // 앨범 정보만 저장하고 편집 모드는 유지
            setIsAlbumInfoModalOpen(false)
          }}
        />

        {/* 사진 확대 모달 */}
        <PhotoModal
          photo={selectedModalPhoto}
          isOpen={isPhotoModalOpen}
          onClose={closePhotoModal}
        />
      </div>
    </div>
  )
}