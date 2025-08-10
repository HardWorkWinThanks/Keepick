"use client"

import { useState } from "react"
import type { AlbumType, GroupPhoto } from "@/entities/group"

export const albumTypes: AlbumType[] = [
  { id: "timeline", name: "TIMELINE ALBUM", subtitle: "타임라인 앨범" },
  { id: "tier", name: "TIER ALBUM", subtitle: "티어 앨범" },
  { id: "highlight", name: "HIGHLIGHT ALBUM", subtitle: "하이라이트 앨범" },
]

// 갤러리는 순환에서 제외하되, 데이터는 유지 (필요시 사용 가능)
export const galleryAlbum: AlbumType = { id: "gallery", name: "GALLERY", subtitle: "갤러리" }

// Album/Gallery 메인 모드 정의
export const mainModes = [
  { id: "album", name: "ALBUM" },
  { id: "gallery", name: "GALLERY" }
] as const

export type MainMode = typeof mainModes[number]["id"]

export const samplePhotos = {
  timeline: [
    { id: 1, title: "가족 여행", subtitle: "제주도 여행", image: "/dummy/jeju-dummy1.webp" },
    { id: 2, title: "생일 파티", subtitle: "아빠 생신", image: "/dummy/main-dummy1.jpg" },
    { id: 3, title: "크리스마스", subtitle: "2023 크리스마스", image: "/dummy/main-dummy2.jpg" },
    { id: 4, title: "새해 첫날", subtitle: "2024 새해", image: "/dummy/main-dummy3.jpg" },
    { id: 5, title: "봄 나들이", subtitle: "벚꽃 구경", image: "/dummy/main-dummy4.jpg" },
    { id: 6, title: "여름 휴가", subtitle: "바다 여행", image: "/dummy/sea-dummy1.jpg" },
    { id: 7, title: "가을 단풍", subtitle: "단풍 구경", image: "/dummy/main-dummy5.jpg" },
    { id: 8, title: "공항에서", subtitle: "출발 전 설렘", image: "/dummy/airport-dummy1.jpg" },
  ],
  tier: [
    { id: 1, title: "최고의 순간", subtitle: "S급 추억", image: "/dummy/jeju-dummy2.jpg" },
    { id: 2, title: "특별한 날", subtitle: "A급 기념일", image: "/dummy/main-dummy6.jpg" },
    { id: 3, title: "소중한 시간", subtitle: "B급 일상", image: "/dummy/main-dummy7.jpg" },
    { id: 4, title: "행복한 순간", subtitle: "A급 웃음", image: "/dummy/main-dummy8.jpg" },
    { id: 5, title: "감동의 순간", subtitle: "S급 감동", image: "/dummy/jeju-dummy3.jpg" },
    { id: 6, title: "맛있는 시간", subtitle: "A급 음식", image: "/dummy/food-dummy1.jpg" },
  ],
  highlight: [
    { id: 1, title: "올해의 베스트", subtitle: "2024 하이라이트", image: "/dummy/main-dummy9.jpg" },
    { id: 2, title: "가족 모임", subtitle: "전체 가족 사진", image: "/dummy/main-dummy10.jpg" },
    { id: 3, title: "성취의 순간", subtitle: "졸업식", image: "/dummy/ssafy-dummy1.jpg" },
    { id: 4, title: "첫 걸음", subtitle: "아기 첫걸음", image: "/dummy/main-dummy11.jpg" },
    { id: 5, title: "제주 여행", subtitle: "아름다운 풍경", image: "/dummy/jeju-dummy4.jpg" },
  ],
  gallery: [
    { id: 1, title: "포트레이트", subtitle: "가족 인물 사진", image: "/dummy/main-dummy12.jpg" },
    { id: 2, title: "풍경 사진", subtitle: "여행지 풍경", image: "/dummy/jeju-dummy5.jpg" },
    { id: 3, title: "일상 스냅", subtitle: "자연스러운 순간", image: "/dummy/main-dummy13.jpg" },
    { id: 4, title: "이벤트 사진", subtitle: "특별한 행사", image: "/dummy/ssafy-dummy2.jpg" },
    { id: 5, title: "아트 사진", subtitle: "창작 사진", image: "/dummy/dummy7.png" },
    { id: 6, title: "빈티지 사진", subtitle: "옛날 사진", image: "/dummy/main-dummy14.jpg" },
    { id: 7, title: "SSAFY 생활", subtitle: "교육 과정", image: "/dummy/ssafy-dummy3.jpg" },
    { id: 8, title: "제주 바다", subtitle: "푸른 바다", image: "/dummy/jeju-dummy6.jpg" },
  ],
}

export function useGroupSpace() {
  const [currentModeIndex, setCurrentModeIndex] = useState(0) // Album/Gallery 모드
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentMode = mainModes[currentModeIndex]
  const currentAlbum = albumTypes[currentAlbumIndex]
  const currentPhotos = samplePhotos[currentAlbum.id as keyof typeof samplePhotos]
  const visiblePhotos = currentPhotos.slice(currentPhotoIndex, currentPhotoIndex + 4)

  const changeMainMode = (direction: "up" | "down") => {
    if (isAnimating) return

    setIsAnimating(true)

    if (direction === "up") {
      setCurrentModeIndex((prev) => (prev === 0 ? mainModes.length - 1 : prev - 1))
    } else {
      setCurrentModeIndex((prev) => (prev === mainModes.length - 1 ? 0 : prev + 1))
    }

    setCurrentPhotoIndex(0)

    setTimeout(() => setIsAnimating(false), 500)
  }

  const changeAlbumType = (direction: "up" | "down") => {
    // Album 모드일 때만 앨범 순환 가능
    if (currentMode.id !== "album" || isAnimating) return

    setIsAnimating(true)

    if (direction === "up") {
      setCurrentAlbumIndex((prev) => (prev === 0 ? albumTypes.length - 1 : prev - 1))
    } else {
      setCurrentAlbumIndex((prev) => (prev === albumTypes.length - 1 ? 0 : prev + 1))
    }

    setCurrentPhotoIndex(0)

    setTimeout(() => setIsAnimating(false), 500)
  }

  const navigatePhotos = (direction: "left" | "right") => {
    if (direction === "left" && currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => Math.max(0, prev - 4))
    } else if (direction === "right" && currentPhotoIndex < currentPhotos.length - 4) {
      setCurrentPhotoIndex((prev) => Math.min(currentPhotos.length - 4, prev + 4))
    }
  }

  return {
    currentMode,
    currentAlbum,
    currentPhotos,
    visiblePhotos,
    currentPhotoIndex,
    isAnimating,
    changeMainMode,
    changeAlbumType,
    navigatePhotos,
  }
}