"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import type { GalleryPhoto, PhotoTag, PhotoFilter, PhotoSelection } from "@/entities/photo"

// Masonry 레이아웃 훅 (useMemo로 변경하여 무한 루프 방지)
export const useMasonryLayout = (photos: GalleryPhoto[], columnCount: number) => {
  const columns = useMemo(() => {
    if (photos.length === 0) return []

    const columnHeights = new Array(columnCount).fill(0)
    const newColumns: GalleryPhoto[][] = Array.from({ length: columnCount }, () => [])

    photos.forEach((photo) => {
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      newColumns[shortestColumnIndex].push(photo)
      columnHeights[shortestColumnIndex] += photo.height + 16
    })

    return newColumns
  }, [photos, columnCount])

  return columns
}

// 드래그 스크롤 훅
export const useDragScroll = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return
    setIsDragging(true)
    setStartX(e.pageX - ref.current.offsetLeft)
    setScrollLeft(ref.current.scrollLeft)
    ref.current.style.cursor = "grabbing"
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return
    e.preventDefault()
    const x = e.pageX - ref.current.offsetLeft
    const walk = (x - startX) * 2
    ref.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (ref.current) {
      ref.current.style.cursor = "grab"
    }
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    if (ref.current) {
      ref.current.style.cursor = "grab"
    }
  }

  return {
    ref,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  }
}

export function usePhotoGallery() {
  // 실제 데이터 사용을 위해 빈 배열로 초기화
  const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [columnCount, setColumnCount] = useState(4)

  // 선택 모드 관련 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false)

  // 모든 태그 추출 (메모이제이션으로 리렌더링 최적화)
  const allTags = useMemo(() => {
    return Array.from(new Set(allPhotos.flatMap((photo) => photo.tags))).sort()
  }, [allPhotos])

  // 선택된 사진들의 실제 데이터
  const selectedPhotoData = useMemo(() => {
    return selectedPhotos.map((id) => allPhotos.find((photo) => photo.id === id)).filter(Boolean) as GalleryPhoto[]
  }, [selectedPhotos, allPhotos])

  // 반응형 컬럼 수 계산
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth
      if (width < 640) setColumnCount(2)
      else if (width < 1024) setColumnCount(3)
      else if (width < 1280) setColumnCount(4)
      else setColumnCount(5)
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => window.removeEventListener("resize", updateColumnCount)
  }, [])

  // 태그 필터링 (useMemo로 변경하여 무한 루프 방지)
  const filteredPhotos = useMemo(() => {
    if (selectedTags.length === 0) {
      return allPhotos
    } else {
      return allPhotos.filter((photo) => 
        selectedTags.some((tag) => photo.tags.includes(tag))
      )
    }
  }, [selectedTags, allPhotos])

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // 모든 태그 해제
  const clearAllTags = () => {
    setSelectedTags([])
  }

  // 선택 모드 관리
  const enterSelectionMode = () => {
    setIsSelectionMode(true)
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedPhotos([])
    setIsPhotosExpanded(false)
  }

  // 사진 선택 토글
  const togglePhotoSelection = (photoId: number) => {
    if (!isSelectionMode) return
    setSelectedPhotos((prev) => 
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    )
  }

  // 선택된 사진들 삭제
  const deleteSelectedPhotos = () => {
    if (selectedPhotos.length === 0) return
    const updatedPhotos = allPhotos.filter((photo) => !selectedPhotos.includes(photo.id))
    setAllPhotos(updatedPhotos)
    setSelectedPhotos([])
    exitSelectionMode()
  }

  // 앨범 생성 함수들 (임시 구현)
  const createTimelineAlbum = () => {
    if (selectedPhotos.length === 0) return
    console.log("타임라인 앨범 생성:", selectedPhotos)
    // TODO: API 호출
    exitSelectionMode()
  }

  const createTierAlbum = () => {
    if (selectedPhotos.length === 0) return
    console.log("티어 앨범 생성:", selectedPhotos)
    // TODO: API 호출
    exitSelectionMode()
  }

  // 갤러리 데이터 설정 (외부에서 호출) - useCallback으로 메모이제이션
  const setGalleryData = useCallback((photos: GalleryPhoto[]) => {
    setAllPhotos(photos)
    setHasMore(false) // overview는 페이지네이션 없음
  }, [])

  // 더 많은 사진 로드 (실제 API 구현 필요)
  const loadMorePhotos = () => {
    setLoading(true)
    // TODO: 실제 API 호출로 변경
    /*
    setTimeout(() => {
      const newPhotos = generatePhotos(allPhotos.length, 20)
      setAllPhotos((prev) => [...prev, ...newPhotos])
      setLoading(false)
      if (allPhotos.length >= 100) {
        setHasMore(false)
      }
    }, 1000)
    */
    setLoading(false)
  }

  return {
    // 데이터
    allPhotos,
    filteredPhotos,
    selectedPhotoData,
    allTags,
    
    // 상태
    selectedTags,
    loading,
    hasMore,
    columnCount,
    isSelectionMode,
    selectedPhotos,
    isPhotosExpanded,
    
    // 액션
    toggleTag,
    clearAllTags,
    enterSelectionMode,
    exitSelectionMode,
    togglePhotoSelection,
    deleteSelectedPhotos,
    createTimelineAlbum,
    createTierAlbum,
    loadMorePhotos,
    setIsPhotosExpanded,
    setGalleryData,
  }
}