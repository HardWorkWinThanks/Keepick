"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import type { GalleryPhoto, PhotoTag, PhotoFilter, PhotoSelection } from "@/entities/photo"

// 임시 더미 데이터 - 실제 데이터로 교체하기 위해 주석처리
/*
const dummyTags = [
  "인물", "풍경", "음식", "동물", "건물", "자연", "가족", "친구", "여행", "일상",
  "축제", "스포츠", "예술", "꽃", "바다", "산", "도시", "밤", "일출", "일몰",
  "아이", "어른", "웃음", "행복"
]

const photoCategories = [
  { category: "가족", titles: ["가족 여행", "가족 모임", "가족 식사", "가족 나들이", "가족 사진"] },
  { category: "일상", titles: ["일상의 순간", "평범한 하루", "소소한 행복", "일상 스냅", "생활 속 순간"] },
  { category: "여행", titles: ["여행지 풍경", "해변 휴가", "산 속 여행", "도시 탐방", "여행 기념품"] },
  { category: "이벤트", titles: ["생일 파티", "졸업식", "결혼식", "기념일", "축하 행사"] },
]

const photoAspectRatios = [
  { ratio: 1, name: "square" },
  { ratio: 1.33, name: "landscape" },
  { ratio: 0.75, name: "portrait" },
  { ratio: 1.5, name: "wide" },
  { ratio: 0.67, name: "tall" },
]

// 더미 데이터 생성 함수
const generatePhotos = (startIndex: number, count: number): GalleryPhoto[] => {
  const photos: GalleryPhoto[] = []
  const baseWidth = 300

  for (let i = 0; i < count; i++) {
    const photoId = startIndex + i + 1
    const randomCategory = photoCategories[Math.floor(Math.random() * photoCategories.length)]
    const randomTitle = randomCategory.titles[Math.floor(Math.random() * randomCategory.titles.length)]
    const randomAspect = photoAspectRatios[Math.floor(Math.random() * photoAspectRatios.length)]
    
    const tagCount = Math.floor(Math.random() * 4) + 2
    const shuffledTags = [...dummyTags].sort(() => 0.5 - Math.random()).slice(0, tagCount)
    
    const start = new Date(2020, 0, 1)
    const end = new Date()
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    
    const width = baseWidth
    const height = Math.round(baseWidth / randomAspect.ratio)

    // 더미 이미지 목록에서 순서대로 선택
    const dummyImages = [
      '/dummy/main-dummy1.jpg',
      '/dummy/main-dummy2.jpg',
      '/dummy/main-dummy3.jpg',
      '/dummy/main-dummy4.jpg',
      '/dummy/main-dummy5.jpg',
      '/dummy/main-dummy6.jpg',
      '/dummy/main-dummy7.jpg',
      '/dummy/main-dummy8.jpg',
      '/dummy/main-dummy9.jpg',
      '/dummy/main-dummy10.jpg',
      '/dummy/main-dummy11.jpg',
      '/dummy/main-dummy12.jpg',
      '/dummy/main-dummy13.jpg',
      '/dummy/main-dummy14.jpg',
      '/dummy/main-dummy15.jpg',
      '/dummy/main-dummy16.jpg',
      '/dummy/main-dummy17.jpg',
      '/dummy/main-dummy18.jpg',
      '/dummy/main-dummy19.jpg',
      '/dummy/main-dummy20.jpg',
    ]
    const imageIndex = (photoId - 1) % dummyImages.length
    const selectedImage = dummyImages[imageIndex]

    photos.push({
      id: photoId,
      src: selectedImage,
      title: `${randomTitle} #${photoId}`,
      category: randomCategory.category,
      aspectRatio: randomAspect.ratio,
      width,
      height,
      date: randomDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      tags: shuffledTags,
    })
  }

  return photos
}
*/

// Masonry 레이아웃 훅
export const useMasonryLayout = (photos: GalleryPhoto[], columnCount: number) => {
  const [columns, setColumns] = useState<GalleryPhoto[][]>([])

  useEffect(() => {
    if (photos.length === 0) return

    const columnHeights = new Array(columnCount).fill(0)
    const newColumns: GalleryPhoto[][] = Array.from({ length: columnCount }, () => [])

    photos.forEach((photo) => {
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      newColumns[shortestColumnIndex].push(photo)
      columnHeights[shortestColumnIndex] += photo.height + 16
    })

    setColumns(newColumns)
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
  const [filteredPhotos, setFilteredPhotos] = useState<GalleryPhoto[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [columnCount, setColumnCount] = useState(4)

  // 선택 모드 관련 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false)

  // 모든 태그 추출
  const allTags = Array.from(new Set(allPhotos.flatMap((photo) => photo.tags))).sort()

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

  // 태그 필터링
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredPhotos(allPhotos)
    } else {
      const filtered = allPhotos.filter((photo) => 
        selectedTags.some((tag) => photo.tags.includes(tag))
      )
      setFilteredPhotos(filtered)
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

  // 갤러리 데이터 설정 (외부에서 호출)
  const setGalleryData = (photos: GalleryPhoto[]) => {
    setAllPhotos(photos)
    setHasMore(false) // overview는 페이지네이션 없음
  }

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