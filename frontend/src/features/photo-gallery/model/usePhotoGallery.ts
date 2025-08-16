"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import type { RootState } from "@/shared/config/store"
import type { GalleryPhoto, PhotoTag, PhotoFilter, PhotoSelection } from "@/entities/photo"
import { 
  toggleSelectedPhoto, 
  clearSelectedPhotos, 
  setIsFromGallery 
} from "./photoSelectionSlice"
import { createTimelineAlbum as createTimelineAlbumAPI } from "@/features/timeline-album/api/timelineAlbumApi"
import { createTierAlbum as createTierAlbumAPI } from "@/features/tier-album/api/tierAlbumApi"

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

export function usePhotoGallery(groupId?: string) {
  // Redux 상태 사용
  const dispatch = useDispatch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPhotos, isFromGallery } = useSelector((state: RootState) => state.photoSelection)
  
  // 실제 데이터 사용을 위해 빈 배열로 초기화
  const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [columnCount, setColumnCount] = useState(4)

  // 선택 모드 관련 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false)

  // 모든 태그 추출 (메모이제이션으로 리렌더링 최적화)
  const allTags = useMemo(() => {
    return Array.from(new Set(allPhotos.flatMap((photo) => photo.tags))).sort()
  }, [allPhotos])

  // Redux에서 이미 GalleryPhoto 배열로 관리되므로 별도 변환 불필요
  const selectedPhotoData = selectedPhotos

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
    // 선택 모드 진입 시 기존 선택 사진들 초기화
    dispatch(clearSelectedPhotos())
  }

  const exitSelectionMode = () => {
    console.log('usePhotoGallery.exitSelectionMode 호출 - 기본 선택 상태 초기화')
    console.log('초기화 전 상태:', { isSelectionMode, selectedPhotosCount: selectedPhotos.length, isPhotosExpanded })
    
    setIsSelectionMode(false)
    dispatch(clearSelectedPhotos())
    setIsPhotosExpanded(false)
    
    console.log('usePhotoGallery.exitSelectionMode 완료 - 모든 기본 상태 초기화됨')
  }

  // 사진 선택 토글 - Redux 사용
  const togglePhotoSelection = (photo: GalleryPhoto) => {
    if (!isSelectionMode) return
    dispatch(toggleSelectedPhoto(photo))
  }

  // 선택된 사진들 삭제
  const deleteSelectedPhotos = () => {
    if (selectedPhotos.length === 0) return
    const selectedIds = selectedPhotos.map(photo => photo.id)
    const updatedPhotos = allPhotos.filter((photo) => !selectedIds.includes(photo.id))
    setAllPhotos(updatedPhotos)
    dispatch(clearSelectedPhotos())
    exitSelectionMode()
  }

  // 앨범 생성 함수들
  const createTimelineAlbum = async () => {
    if (selectedPhotos.length === 0 || !groupId) return
    
    try {
      setLoading(true)
      const photoIds = selectedPhotos.map(photo => photo.id)
      
      // 갤러리에서 선택됨을 표시
      dispatch(setIsFromGallery(true))
      
      // API 호출
      const result = await createTimelineAlbumAPI(parseInt(groupId), photoIds)
      
      // 타임라인 앨범 목록 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['timelineAlbums', parseInt(groupId)] 
      })
      
      // 성공시 해당 앨범 페이지로 라우팅 (편집 모드로 진입)
      router.push(`/group/${groupId}/timeline/${result.albumId}?edit=true`)
      
      // 선택 모드 종료는 라우팅 후 해당 페이지에서 처리
    } catch (error) {
      console.error("타임라인 앨범 생성 실패:", error)
      // 실패시 선택 상태 유지하여 재시도 가능
      dispatch(setIsFromGallery(false))
    } finally {
      setLoading(false)
    }
  }

  const createTierAlbum = async () => {
    if (selectedPhotos.length === 0 || !groupId) return
    
    try {
      setLoading(true)
      const photoIds = selectedPhotos.map(photo => photo.id)
      
      // 갤러리에서 선택됨을 표시
      dispatch(setIsFromGallery(true))
      
      // API 호출
      const tierAlbumId = await createTierAlbumAPI(parseInt(groupId), photoIds)
      
      // 성공시 해당 앨범 페이지로 라우팅
      router.push(`/group/${groupId}/tier/${tierAlbumId}`)
      
      // 선택 모드 종료는 라우팅 후 해당 페이지에서 처리
    } catch (error) {
      console.error("티어 앨범 생성 실패:", error)
      // 실패시 선택 상태 유지하여 재시도 가능
      dispatch(setIsFromGallery(false))
      
      // 에러 타입별 사용자 친화적 메시지 (향후 toast 등으로 표시)
      if (error instanceof Error) {
        if (error.message.includes("B004")) {
          console.error("포함할 사진은 최소 1개 이상이어야 합니다.")
        } else if (error.message.includes("B003")) {
          console.error("리소스를 찾을 수 없습니다.")
        }
      }
    } finally {
      setLoading(false)
    }
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
    isFromGallery,
    
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