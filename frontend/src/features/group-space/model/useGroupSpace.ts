"use client"

import { useState } from "react"
import type { AlbumType, GroupPhoto } from "@/entities/group"

export const albumTypes: AlbumType[] = [
  { id: "timeline", name: "TIMELINE ALBUM", subtitle: "타임라인 앨범" },
  { id: "tier", name: "TIER ALBUM", subtitle: "티어 앨범" },
  { id: "highlight", name: "HIGHLIGHT ALBUM", subtitle: "하이라이트 앨범" },
  { id: "gallery", name: "GALLERY", subtitle: "갤러리" },
]

export const samplePhotos = {
  timeline: [
    { id: 1, title: "가족 여행", subtitle: "제주도 여행", image: "/placeholder.svg?height=600&width=480" },
    { id: 2, title: "생일 파티", subtitle: "아빠 생신", image: "/placeholder.svg?height=600&width=480" },
    { id: 3, title: "크리스마스", subtitle: "2023 크리스마스", image: "/placeholder.svg?height=600&width=480" },
    { id: 4, title: "새해 첫날", subtitle: "2024 새해", image: "/placeholder.svg?height=600&width=480" },
    { id: 5, title: "봄 나들이", subtitle: "벚꽃 구경", image: "/placeholder.svg?height=600&width=480" },
    { id: 6, title: "여름 휴가", subtitle: "바다 여행", image: "/placeholder.svg?height=600&width=480" },
    { id: 7, title: "가을 단풍", subtitle: "단풍 구경", image: "/placeholder.svg?height=600&width=480" },
  ],
  tier: [
    { id: 1, title: "최고의 순간", subtitle: "S급 추억", image: "/placeholder.svg?height=600&width=480" },
    { id: 2, title: "특별한 날", subtitle: "A급 기념일", image: "/placeholder.svg?height=600&width=480" },
    { id: 3, title: "소중한 시간", subtitle: "B급 일상", image: "/placeholder.svg?height=600&width=480" },
    { id: 4, title: "행복한 순간", subtitle: "A급 웃음", image: "/placeholder.svg?height=600&width=480" },
    { id: 5, title: "감동의 순간", subtitle: "S급 감동", image: "/placeholder.svg?height=600&width=480" },
  ],
  highlight: [
    { id: 1, title: "올해의 베스트", subtitle: "2024 하이라이트", image: "/placeholder.svg?height=600&width=480" },
    { id: 2, title: "가족 모임", subtitle: "전체 가족 사진", image: "/placeholder.svg?height=600&width=480" },
    { id: 3, title: "성취의 순간", subtitle: "졸업식", image: "/placeholder.svg?height=600&width=480" },
    { id: 4, title: "첫 걸음", subtitle: "아기 첫걸음", image: "/placeholder.svg?height=600&width=480" },
  ],
  gallery: [
    { id: 1, title: "포트레이트", subtitle: "가족 인물 사진", image: "/placeholder.svg?height=600&width=480" },
    { id: 2, title: "풍경 사진", subtitle: "여행지 풍경", image: "/placeholder.svg?height=600&width=480" },
    { id: 3, title: "일상 스냅", subtitle: "자연스러운 순간", image: "/placeholder.svg?height=600&width=480" },
    { id: 4, title: "이벤트 사진", subtitle: "특별한 행사", image: "/placeholder.svg?height=600&width=480" },
    { id: 5, title: "아트 사진", subtitle: "창작 사진", image: "/placeholder.svg?height=600&width=480" },
    { id: 6, title: "빈티지 사진", subtitle: "옛날 사진", image: "/placeholder.svg?height=600&width=480" },
  ],
}

export function useGroupSpace() {
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentAlbum = albumTypes[currentAlbumIndex]
  const currentPhotos = samplePhotos[currentAlbum.id as keyof typeof samplePhotos]
  const visiblePhotos = currentPhotos.slice(currentPhotoIndex, currentPhotoIndex + 4)

  const changeAlbumType = (direction: "up" | "down") => {
    if (isAnimating) return

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
      setCurrentPhotoIndex((prev) => prev - 1)
    } else if (direction === "right" && currentPhotoIndex < currentPhotos.length - 4) {
      setCurrentPhotoIndex((prev) => prev + 1)
    }
  }

  return {
    currentAlbum,
    currentPhotos,
    visiblePhotos,
    currentPhotoIndex,
    isAnimating,
    changeAlbumType,
    navigatePhotos,
  }
}