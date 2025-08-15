"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { TierPhoto } from "../types"
import { getTierAlbum, type TierAlbum } from "../api/tierAlbumApi"

export function useTierAlbum(groupId: string, tierAlbumId: string) {
  const queryClient = useQueryClient()
  const [currentTier, setCurrentTier] = useState<"S" | "A" | "B" | "C" | "D">("S")
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  
  // API를 통한 티어 앨범 데이터 조회
  const { data: tierAlbumData, isLoading, error } = useQuery({
    queryKey: ['tierAlbum', groupId, tierAlbumId],
    queryFn: () => getTierAlbum(parseInt(groupId), parseInt(tierAlbumId)),
    enabled: !!groupId && !!tierAlbumId,
  })

  // API 데이터를 TierPhoto 형식으로 변환 (실제 API 응답 구조 기반)
  // UNASSIGNED는 뷰 모드에서 제외 (편집 모드에서만 사용)
  const photos: TierPhoto[] = tierAlbumData?.photos ? 
    Object.entries(tierAlbumData.photos)
      .filter(([tier]) => tier !== 'UNASSIGNED')  // UNASSIGNED 제외
      .flatMap(([tier, photos]) =>
        photos.map(photo => ({
          id: photo.photoId,
          src: photo.originalUrl,  // originalUrl을 src로 사용
          title: `사진 #${photo.photoId}`,
          date: new Date().toISOString().split('T')[0].replace(/-/g, '.'), // 임시 날짜 (API에 없음)
          tier: tier as "S" | "A" | "B" | "C" | "D",
        }))
      ) : []

  // 현재 티어의 사진들 필터링
  const currentTierPhotos = photos.filter((photo) => photo.tier === currentTier)
  const currentPhoto = currentTierPhotos[currentPhotoIndex]

  // 티어별 사진 개수 계산
  const getTierCount = (tierId: "S" | "A" | "B" | "C" | "D") => {
    return photos.filter((photo) => photo.tier === tierId).length
  }

  // 티어 변경 시 인덱스 리셋
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [currentTier])

  // 이전/다음 사진 이동
  const goToPrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? currentTierPhotos.length - 1 : prev - 1))
  }

  const goToNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === currentTierPhotos.length - 1 ? 0 : prev + 1))
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
  }, [currentTierPhotos.length])

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