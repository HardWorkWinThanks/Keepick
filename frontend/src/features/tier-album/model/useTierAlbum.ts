"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { TierPhoto } from "../types"
import { getTierAlbum, type TierAlbum } from "../api/tierAlbumApi"

// 티어 순서 정의 (네비게이션용)
const TIER_ORDER = ["S", "A", "B", "C", "D"] as const
type TierType = typeof TIER_ORDER[number]

export function useTierAlbum(groupId: string, tierAlbumId: string) {
  const queryClient = useQueryClient()
  const [currentTier, setCurrentTier] = useState<TierType>("S")
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  
  // API를 통한 티어 앨범 데이터 조회
  const { data: tierAlbumData, isLoading, error } = useQuery({
    queryKey: ['tierAlbum', groupId, tierAlbumId],
    queryFn: () => getTierAlbum(parseInt(groupId), parseInt(tierAlbumId)),
    enabled: !!groupId && !!tierAlbumId,
  })

  // API 데이터를 TierPhoto 형식으로 변환 (실제 API 응답 구조 기반)
  // UNASSIGNED는 뷰 모드에서 제외 (편집 모드에서만 사용)
  console.log('티어 앨범 API 데이터:', tierAlbumData)
  const photos: TierPhoto[] = tierAlbumData?.photos ? 
    Object.entries(tierAlbumData.photos)
      .filter(([tier]) => tier !== 'UNASSIGNED')  // UNASSIGNED 제외
      .flatMap(([tier, photos]) =>
        photos.map(photo => ({
          id: photo.photoId,
          src: photo.originalUrl,  // 메인 표시용 고화질 이미지
          thumbnailUrl: photo.thumbnailUrl,  // 썸네일용 저화질 이미지
          originalUrl: photo.originalUrl,  // 원본 이미지 URL 보존
          title: `사진 #${photo.photoId}`,
          date: new Date().toISOString().split('T')[0].replace(/-/g, '.'), // 임시 날짜 (API에 없음)
          tier: tier as "S" | "A" | "B" | "C" | "D",
        }))
      ) : []

  // 현재 티어의 사진들 필터링
  const currentTierPhotos = photos.filter((photo) => photo.tier === currentTier)
  const currentPhoto = currentTierPhotos[currentPhotoIndex]

  // 티어별 사진 개수 계산
  const getTierCount = (tierId: TierType) => {
    return photos.filter((photo) => photo.tier === tierId).length
  }

  // 사진이 있는 다음 티어 찾기
  const getNextTierWithPhotos = (currentTierIndex: number): TierType | null => {
    for (let i = 1; i < TIER_ORDER.length; i++) {
      const nextIndex = (currentTierIndex + i) % TIER_ORDER.length
      const nextTier = TIER_ORDER[nextIndex]
      if (getTierCount(nextTier) > 0) {
        return nextTier
      }
    }
    return null // 모든 티어가 비어있음
  }

  // 사진이 있는 이전 티어 찾기  
  const getPrevTierWithPhotos = (currentTierIndex: number): TierType | null => {
    for (let i = 1; i < TIER_ORDER.length; i++) {
      const prevIndex = (currentTierIndex - i + TIER_ORDER.length) % TIER_ORDER.length
      const prevTier = TIER_ORDER[prevIndex]
      if (getTierCount(prevTier) > 0) {
        return prevTier
      }
    }
    return null // 모든 티어가 비어있음
  }

  // 티어 변경 시 인덱스 리셋
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [currentTier])

  // 이전/다음 사진 이동 (티어 간 네비게이션 포함)
  const goToPrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      // 현재 티어 내에서 이전 사진으로
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    } else {
      // 현재 티어의 첫 번째 사진이면 이전 티어의 마지막 사진으로 이동
      const currentTierIndex = TIER_ORDER.indexOf(currentTier)
      const prevTier = getPrevTierWithPhotos(currentTierIndex)
      
      if (prevTier) {
        const prevTierPhotos = photos.filter((photo) => photo.tier === prevTier)
        setCurrentTier(prevTier)
        setCurrentPhotoIndex(prevTierPhotos.length - 1) // 이전 티어의 마지막 사진
      }
      // 모든 티어가 비어있으면 아무것도 하지 않음
    }
  }

  const goToNextPhoto = () => {
    if (currentPhotoIndex < currentTierPhotos.length - 1) {
      // 현재 티어 내에서 다음 사진으로
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    } else {
      // 현재 티어의 마지막 사진이면 다음 티어의 첫 번째 사진으로 이동
      const currentTierIndex = TIER_ORDER.indexOf(currentTier)
      const nextTier = getNextTierWithPhotos(currentTierIndex)
      
      if (nextTier) {
        setCurrentTier(nextTier)
        setCurrentPhotoIndex(0) // 다음 티어의 첫 번째 사진
      }
      // 모든 티어가 비어있으면 아무것도 하지 않음
    }
  }

  // 특정 사진으로 이동
  const goToPhoto = (index: number) => {
    setCurrentPhotoIndex(index)
  }

  // 티어 앨범 데이터 새로고침
  const refreshTierAlbumData = () => {
    return queryClient.invalidateQueries({
      queryKey: ['tierAlbum', groupId, tierAlbumId]
    })
  }

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevPhoto()
      if (e.key === "ArrowRight") goToNextPhoto()
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentTier, currentPhotoIndex, photos.length]) // 의존성에 티어와 전체 사진 데이터 추가

  return {
    isLoading,
    error,
    photos,
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
  }
}