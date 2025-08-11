"use client"

import { useState, useEffect } from "react"
import type { TierPhoto } from "../types"

// 샘플 티어 사진 데이터
const tierPhotos: TierPhoto[] = [
  // S 티어 (5장)
  { id: 1, src: "/dummy/jaewan1.jpg", title: "가족 여행 최고의 순간", date: "2024.07.15", tier: "S" },
  { id: 2, src: "/dummy/main-dummy2.jpg", title: "졸업식", date: "2024.02.20", tier: "S" },
  { id: 3, src: "/dummy/main-dummy3.jpg", title: "결혼기념일", date: "2024.05.10", tier: "S" },
  { id: 4, src: "/dummy/main-dummy4.jpg", title: "아기 첫걸음", date: "2024.03.25", tier: "S" },
  { id: 5, src: "/dummy/main-dummy5.jpg", title: "가족 단체사진", date: "2024.12.25", tier: "S" },

  // A 티어 (5장)
  { id: 6, src: "/dummy/main-dummy6.jpg", title: "생일 파티", date: "2024.04.12", tier: "A" },
  { id: 7, src: "/dummy/main-dummy7.jpg", title: "학교 축제", date: "2024.09.15", tier: "A" },
  { id: 8, src: "/dummy/main-dummy8.jpg", title: "캠핑 여행", date: "2024.08.20", tier: "A" },
  { id: 9, src: "/dummy/main-dummy9.jpg", title: "크리스마스 아침", date: "2024.12.25", tier: "A" },
  { id: 10, src: "/dummy/main-dummy10.jpg", title: "해변 일몰", date: "2024.07.30", tier: "A" },

  // B 티어 (6장)
  { id: 11, src: "/dummy/main-dummy11.jpg", title: "피크닉", date: "2024.05.05", tier: "B" },
  { id: 12, src: "/dummy/main-dummy12.jpg", title: "영화 관람", date: "2024.06.18", tier: "B" },
  { id: 13, src: "/dummy/main-dummy13.jpg", title: "함께 요리하기", date: "2024.03.10", tier: "B" },
  { id: 14, src: "/dummy/main-dummy14.jpg", title: "공원 산책", date: "2024.04.22", tier: "B" },
  { id: 15, src: "/dummy/main-dummy15.jpg", title: "게임 시간", date: "2024.11.08", tier: "B" },
  { id: 16, src: "/dummy/main-dummy16.jpg", title: "쇼핑", date: "2024.10.15", tier: "B" },

  // C 티어 (4장)
  { id: 17, src: "/dummy/jeju-dummy1.jpg", title: "일상 모습", date: "2024.01.15", tier: "C" },
  { id: 18, src: "/dummy/jeju-dummy2.jpg", title: "숙제 시간", date: "2024.02.28", tier: "C" },
  { id: 19, src: "/dummy/jeju-dummy3.jpg", title: "청소하는 날", date: "2024.03.05", tier: "C" },
  { id: 20, src: "/dummy/jeju-dummy4.jpg", title: "버스 기다리기", date: "2024.09.12", tier: "C" },

  // D 티어 (3장)
  { id: 21, src: "/dummy/jeju-dummy5.jpg", title: "흔들린 사진", date: "2024.01.20", tier: "D" },
  { id: 22, src: "/dummy/jeju-dummy6.jpg", title: "우연한 순간", date: "2024.06.30", tier: "D" },
  { id: 23, src: "/dummy/jeju-dummy7.jpg", title: "테스트 촬영", date: "2024.11.22", tier: "D" },
]

export function useTierAlbum(groupId: string, albumId: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentTier, setCurrentTier] = useState<"S" | "A" | "B" | "C" | "D">("S")
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [photos, setPhotos] = useState<TierPhoto[]>(tierPhotos)

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

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevPhoto()
      if (e.key === "ArrowRight") goToNextPhoto()
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentTierPhotos.length])

  // 초기 로딩 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [groupId, albumId])

  return {
    isLoading,
    photos,
    currentTier,
    currentPhotoIndex,
    currentTierPhotos,
    currentPhoto,
    setCurrentTier,
    getTierCount,
    goToPrevPhoto,
    goToNextPhoto,
    goToPhoto,
  }
}