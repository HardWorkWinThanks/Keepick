"use client"

import { useState, useRef, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTierAlbum } from "../model/useTierAlbum"
import { updateTierAlbum } from "../api/tierAlbumApi"
import { addPhotosToTierAlbum, removePhotosFromTierAlbum } from "../api/tierAlbumPhotos"
import { saveEditingState, clearEditingState, TierEditingState } from "@/shared/lib/editingStateManager"
import type { TierInfo, TierType } from "../types"
import { Photo, DragPhotoData } from "@/entities/photo"
import { TIER_COLORS } from "@/shared/config/tierColors"
import type { RootState } from "@/shared/config/store"
import { clearSelectedPhotos, setIsFromGallery } from "@/features/photo-gallery/model/photoSelectionSlice"
import { AlbumEditingSidebar, type EditingAlbumInfo } from "@/shared/ui/composite"
import {
  useAlbumState,
} from "@/features/album-management"
import {
  useTierGrid,
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
  const dispatch = useDispatch()
  const { selectedPhotos, isFromGallery } = useSelector((state: RootState) => state.photoSelection)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // 앨범 정보 편집 상태
  const [albumInfo, setAlbumInfo] = useState<EditingAlbumInfo | null>(null)
  const [coverImage, setCoverImage] = useState<Photo | null>(null)
  
  const {
    isLoading,
    error,
    photos: tierAlbumPhotos,
    tierAlbumData,
    currentTier,
    currentPhotoIndex,
    currentTierPhotos,
    currentPhoto,
    setCurrentTier,
    getTierCount,
    goToPrevPhoto,
    goToNextPhoto,
    goToPhoto,
    refreshTierAlbumData,
  } = useTierAlbum(groupId, tierAlbumId)

  // 편집 모드에서 사용할 상태들
  const {
    availablePhotos,
    setAvailablePhotos,
  } = useAlbumState()

  // 사진 모달을 위한 상태 관리
  const { photo: selectedModalPhoto, isOpen: isPhotoModalOpen, openModal: openPhotoModal, closeModal: closePhotoModal } = usePhotoModal()

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
    setShowComparisonModal,
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
    if (isEditMode && isFromGallery) {
      // 편집 완료 시 선택 상태 초기화
      dispatch(clearSelectedPhotos())
      dispatch(setIsFromGallery(false))
    }
    setIsEditMode(!isEditMode)
  }

  // tierAlbumData가 로드되면 앨범 정보 초기화
  useEffect(() => {
    if (tierAlbumData) {
      setAlbumInfo({
        name: tierAlbumData.title || '',
        description: tierAlbumData.description || '',
      })
      
      // 대표이미지 설정 (첫 번째 사진을 대표이미지로 사용)
      const firstPhoto = Object.values(tierAlbumData.photos).flat()[0]
      if (firstPhoto) {
        setCoverImage({
          id: firstPhoto.photoId,
          originalUrl: firstPhoto.originalUrl,
          thumbnailUrl: firstPhoto.thumbnailUrl,
          name: `사진 #${firstPhoto.photoId}`
        })
      }
    }
  }, [tierAlbumData])

  // 갤러리에서 선택된 사진들로 앨범을 생성한 경우 자동으로 편집 모드 진입
  useEffect(() => {
    if (isFromGallery && selectedPhotos.length > 0) {
      setIsEditMode(true)
      console.log('갤러리에서 선택된 사진들로 티어 앨범 편집 시작:', selectedPhotos)
    }
  }, [isFromGallery, selectedPhotos])

  // 편집 모드 진입 시 데이터 설정
  useEffect(() => {
    if (isEditMode) {
      if (isFromGallery && selectedPhotos.length > 0) {
        // 갤러리에서 선택된 사진들을 사용 가능한 사진으로 설정
        const photosToUse = selectedPhotos.map(photo => ({
          id: photo.id,
          originalUrl: photo.originalUrl,
          thumbnailUrl: photo.thumbnailUrl,
          name: photo.title || `사진 #${photo.id}`
        }))
        setAvailablePhotos(photosToUse)
        
        // 기본 빈 티어 설정
        setTierPhotos({
          S: [],
          A: [],
          B: [],
          C: [],
          D: [],
        })
      } else if (tierAlbumData?.photos) {
        // 기존 앨범 데이터를 편집용 형식으로 변환
        const convertedTierPhotos: TierData = {
          S: tierAlbumData.photos.S?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
            id: photo.photoId,
            originalUrl: photo.originalUrl,
            thumbnailUrl: photo.thumbnailUrl,
            name: `사진 #${photo.photoId}`
          })) || [],
          A: tierAlbumData.photos.A?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
            id: photo.photoId,
            originalUrl: photo.originalUrl,
            thumbnailUrl: photo.thumbnailUrl,
            name: `사진 #${photo.photoId}`
          })) || [],
          B: tierAlbumData.photos.B?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
            id: photo.photoId,
            originalUrl: photo.originalUrl,
            thumbnailUrl: photo.thumbnailUrl,
            name: `사진 #${photo.photoId}`
          })) || [],
          C: tierAlbumData.photos.C?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
            id: photo.photoId,
            originalUrl: photo.originalUrl,
            thumbnailUrl: photo.thumbnailUrl,
            name: `사진 #${photo.photoId}`
          })) || [],
          D: tierAlbumData.photos.D?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
            id: photo.photoId,
            originalUrl: photo.originalUrl,
            thumbnailUrl: photo.thumbnailUrl,
            name: `사진 #${photo.photoId}`
          })) || [],
        }
        setTierPhotos(convertedTierPhotos)
        
        // UNASSIGNED 사진들을 사용 가능한 사진으로 설정
        const unassignedPhotos = tierAlbumData.photos.UNASSIGNED?.sort((a, b) => a.sequence - b.sequence).map(photo => ({
          id: photo.photoId,
          originalUrl: photo.originalUrl,
          thumbnailUrl: photo.thumbnailUrl,
          name: `사진 #${photo.photoId}`
        })) || []
        setAvailablePhotos(unassignedPhotos)
      }
    }
  }, [tierAlbumId, isEditMode, isFromGallery, selectedPhotos, tierAlbumData])

  // 저장 핸들러 - 실제 API 명세에 맞게 수정
  const handleSave = async () => {
    try {
      // TierData를 API 요청 형식으로 변환 (실제 API 명세 기반)
      const photosToSave = {
        S: tierPhotos.S?.map(photo => photo.id) || [],
        A: tierPhotos.A?.map(photo => photo.id) || [],
        B: tierPhotos.B?.map(photo => photo.id) || [],
        C: tierPhotos.C?.map(photo => photo.id) || [],
        D: tierPhotos.D?.map(photo => photo.id) || [],
      }

      // 썸네일 ID 설정 - S 티어의 첫 번째 사진을 대표이미지로 사용
      const thumbnailId = tierPhotos.S?.[0]?.id || tierPhotos.A?.[0]?.id || tierPhotos.B?.[0]?.id || tierPhotos.C?.[0]?.id || tierPhotos.D?.[0]?.id || null

      await updateTierAlbum(parseInt(groupId), parseInt(tierAlbumId), {
        name: albumInfo?.name || tierAlbumData?.title || "티어 앨범",
        description: albumInfo?.description || tierAlbumData?.description || "",
        thumbnailId: thumbnailId,
        photos: photosToSave
      })

      // 저장 후 최신 데이터 새로고침
      await refreshTierAlbumData()

      // 바로 뷰 모드로 전환
      setIsEditMode(false)
    } catch (error) {
      console.error("티어 앨범 저장 실패:", error)
      alert("❌ 티어 앨범 저장에 실패했습니다. 다시 시도해주세요.")
    }
  }

  // 앨범 정보 업데이트 핸들러
  const handleAlbumInfoUpdate = (updates: Partial<EditingAlbumInfo>) => {
    setAlbumInfo(prev => prev ? { ...prev, ...updates } : null)
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
    
    // 티어에서 온 사진인 경우 해당 티어에서 제거
    if (dragData.source !== "available" && dragData.source !== "cover-image") {
      handleReturnToAvailable(dragData.photoId, dragData.source, (photo) =>
        setAvailablePhotos((prev) => [...prev, photo])
      )
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

  // 사이드바에서 드롭될 때 처리 (티어 → 사용가능한 사진)
  const handleSidebarDrop = (dragData: DragPhotoData) => {
    // 드롭 완료 후 상태 초기화
    setDragOverPosition(null)
    setDraggingPhotoId(null)
    
    console.log('사이드바 드롭:', dragData)
    
    if (dragData.source !== "available" && dragData.source !== "cover-image") {
      handleReturnToAvailable(dragData.photoId, dragData.source, (photo) =>
        setAvailablePhotos((prev) => [...prev, photo])
      )
    } else if (dragData.source === "cover-image") {
      handleCoverImageRemove(dragData)
    }
    // available 소스는 이미 사이드바에 있으므로 아무것도 하지 않음
  }

  // 드래그 핸들러들 (tier-battle의 형식에 맞게 수정)
  const handleDragStart = (
    e: React.DragEvent,
    photo: Photo,
    source: string | "available"
  ) => {
    // DragPhotoData 형식으로 드래그 데이터 설정
    const dragData: DragPhotoData = {
      photoId: photo.id,
      source: source,
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: photo.name || `사진 #${photo.id}`
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    setDraggingPhotoId(photo.id)
  }

  const handleDragEnd = () => {
    // 즉시 상태 초기화
    setDraggingPhotoId(null)
    setDragOverPosition(null)
    
    // 추가 안전장치: 100ms 후 다시 한번 초기화
    setTimeout(() => {
      setDraggingPhotoId(null)
      setDragOverPosition(null)
    }, 100)
  }

  // 통합된 드래그 핸들러 (사용가능한 사진용)
  const handleAvailablePhotoDragStart = (_: React.DragEvent<HTMLDivElement>, photo: Photo) => {
    setDraggingPhotoId(photo.id)
  }

  const handleAvailablePhotoDragEnd = () => {
    // 즉시 상태 초기화
    setDraggingPhotoId(null)
    
    // 추가 안전장치: 100ms 후 다시 한번 초기화
    setTimeout(() => {
      setDraggingPhotoId(null)
    }, 100)
  }

  const handleDragOverTierArea = (e: React.DragEvent, tier: string) => {
    e.preventDefault() // 드롭을 가능하게 하기 위해 필수
    try {
      setDragOverPosition({ tier, index: (tierPhotos[tier] || []).length })
    } catch (error) {
      console.error('TierAlbum handleDragOverTierArea 오류:', error)
    }
  }

  const handleDropTierArea = (e: React.DragEvent, targetTier: string) => {
    e.preventDefault() // 브라우저 기본 동작 방지
    try {
      handleDropAtPosition(e, targetTier, (tierPhotos[targetTier] || []).length)
    } catch (error) {
      console.error('TierAlbum handleDropTierArea 오류:', error)
    }
  }

  const handleDragOverPosition = (
    e: React.DragEvent,
    tier: string,
    index: number
  ) => {
    e.preventDefault() // 드롭을 가능하게 하기 위해 필수
    e.stopPropagation() // 이벤트 버블링 방지
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const isLeftHalf = mouseX < rect.width / 2
      const targetIndex = isLeftHalf ? index : index + 1
      setDragOverPosition({ tier, index: targetIndex })
    } catch (error) {
      console.error('TierAlbum handleDragOverPosition 오류:', error)
    }
  }

  const handleDropAtPosition = (
    e: React.DragEvent,
    targetTier: string,
    targetIndex: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 드롭 즉시 상태 초기화
    setDragOverPosition(null)
    setDraggingPhotoId(null)

    try {
      const dragDataString = e.dataTransfer.getData("text/plain")
      
      // 비어있거나 유효하지 않은 데이터 검사
      if (!dragDataString || dragDataString.trim() === '') {
        console.warn('TierAlbum handleDropAtPosition: 빈 드래그 데이터를 받았습니다')
        return
      }
      
      const dragData: DragPhotoData = JSON.parse(dragDataString)
      
      // 기본 필드 검증
      if (!dragData.photoId) {
        console.warn('TierAlbum handleDropAtPosition: 유효하지 않은 드래그 데이터입니다:', dragData)
        return
      }
      
      const { photoId, source } = dragData
      const draggedPhoto =
        source === "available"
          ? availablePhotos.find((p) => p.id === photoId)
          : tierPhotos[source]?.find((p) => p.id === photoId)

      if (!draggedPhoto) {
        console.warn('TierAlbum handleDropAtPosition: 드래그된 사진을 찾을 수 없습니다:', photoId)
        console.warn('사용 가능한 사진들:', availablePhotos.map(p => p.id))
        console.warn('드래그 데이터:', dragData)
        return
      }

      const sourceIndex =
        source !== "available"
          ? tierPhotos[source]?.findIndex((p) => p.id === photoId) ?? -1
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
      
    } catch (error) {
      console.error('TierAlbum handleDropAtPosition: 드래그 데이터 파싱 실패:', error)
      console.error('원본 데이터:', e.dataTransfer.getData("text/plain"))
    }
  }
  
  // 갤러리에서 사진 추가 하들러
  const handleAddPhotos = () => {
    // 현재 편집 상태를 sessionStorage에 저장
    const currentState: TierEditingState = {
      albumInfo: {
        name: albumInfo?.name || '',
        description: albumInfo?.description || ''
      },
      tierPhotos: tierPhotos as { S: Photo[]; A: Photo[]; B: Photo[]; C: Photo[]; D: Photo[]; },
      availablePhotos: availablePhotos
    }
    
    saveEditingState('tier', currentState)
    
    // 갤러리로 이동 (추가 모드로) - 그룹 페이지에서 갤러리 모드로
    window.location.href = `/group/${groupId}?gallery=true&mode=add&target=tier&albumId=${tierAlbumId}`
  }
  
  // 사진 삭제 하들러
  const handleDeletePhotos = async (photoIds: number[]) => {
    try {
      console.log('티어 앨범에서 사진 삭제:', photoIds)
      
      // API 호출로 사진 삭제
      await removePhotosFromTierAlbum(parseInt(groupId), parseInt(tierAlbumId), photoIds)
      
      // 로컬 상태 업데이트: availablePhotos에서 삭제
      const updatedAvailablePhotos = availablePhotos.filter(photo => !photoIds.includes(photo.id))
      setAvailablePhotos(updatedAvailablePhotos)
      
      // 티어에서도 삭제된 사진들 제거 (null 체크 추가)
      const updatedTierPhotos = { ...tierPhotos }
      Object.keys(updatedTierPhotos).forEach(tier => {
        updatedTierPhotos[tier] = updatedTierPhotos[tier].filter(photo => photo && photo.id && !photoIds.includes(photo.id))
      })
      setTierPhotos(updatedTierPhotos)
      
      // 대표이미지도 삭제된 사진이면 제거
      if (coverImage && photoIds.includes(coverImage.id)) {
        setCoverImage(null)
      }
      
      console.log(`${photoIds.length}장의 사진을 티어 앨범에서 삭제 완료`)
      
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.')
    }
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${currentTierInfo.color}40 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${currentTierInfo.color}20 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Header */}
      <header 
        className={`fixed top-0 z-50 bg-[#111111] border-b border-gray-800 transition-all duration-300 ${
          isEditMode ? 'left-[320px] right-0' : 'left-0 right-0'
        }`}
      >
        <div className="flex items-center justify-between px-8 py-4">
          <Link href={`/group/${groupId}?album=tier`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={20} />
            <span className="font-keepick-primary text-sm">돌아가기</span>
          </Link>
          <div className="text-center">
            <h1 className="font-keepick-heavy text-xl tracking-wider">
              {tierAlbumData?.title || `TIER ALBUM ${tierAlbumId}`}
            </h1>
          </div>
          <button 
            onClick={isEditMode ? handleSave : toggleEditMode}
            className="px-6 py-2 border-2 border-orange-500 hover:border-orange-400 text-orange-500 hover:text-orange-400 bg-transparent font-keepick-primary text-sm rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
          >
            {isEditMode ? "티어 완성하기" : "티어 수정하기"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${isEditMode ? 'min-h-screen bg-[#111111] pt-24' : 'h-screen flex flex-col pt-16'} relative z-10`}>
        {isEditMode ? (
          // 편집 모드 - 새로운 사이드바 + 티어 그리드 레이아웃
          <div className="flex gap-6 animate-fade-in pb-8 px-8 h-screen pl-[340px]">
            {/* 우측: 티어 그리드 */}
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
                    src={currentPhoto.originalUrl || "/placeholder.svg"}
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
                  src={photo.thumbnailUrl || "/placeholder.svg"} 
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

      {/* Album Editing Sidebar */}
      <AlbumEditingSidebar 
        isOpen={isEditMode}
        onClose={() => setIsEditMode(false)}
        availablePhotos={availablePhotos}
        draggingPhotoId={draggingPhotoId}
        onDragStart={(e, photo) => {
          // DragPhotoData 형식으로 드래그 시작 - source를 'available'로 통일
          const dragData: DragPhotoData = {
            photoId: photo.id,
            source: 'available',
            originalUrl: photo.originalUrl,
            thumbnailUrl: photo.thumbnailUrl,
            name: photo.name || `사진 #${photo.id}`
          }
          e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
          e.dataTransfer.effectAllowed = 'move'
          setDraggingPhotoId(photo.id)
          console.log('티어 앨범 사이드바에서 드래그 시작:', dragData)
        }}
        onDragEnd={handleAvailablePhotoDragEnd}
        onDrop={handleSidebarDrop}
        albumInfo={albumInfo}
        onAlbumInfoUpdate={handleAlbumInfoUpdate}
        coverImage={coverImage}
        onCoverImageDrop={handleCoverImageDrop}
        onCoverImageRemove={handleCoverImageRemove}
        showDateInputs={false}
        title="티어 앨범 수정"
        description="앨범 정보와 사진을 수정하세요."
        instructions={[
          "드래그&드롭으로 앨범을 자유롭게 꾸미세요!"
        ]}
        onAddPhotos={handleAddPhotos}
        onDeletePhotos={handleDeletePhotos}
        albumType="tier"
        groupId={groupId}
        albumId={tierAlbumId}
      />

      {/* 사진 확대 모달 */}
      <PhotoModal
        photo={selectedModalPhoto}
        isOpen={isPhotoModalOpen}
        onClose={closePhotoModal}
      />
    </div>
  )
}