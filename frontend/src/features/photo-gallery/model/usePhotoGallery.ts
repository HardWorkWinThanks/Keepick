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
  selectAllPhotos as selectAllPhotosAction,
  deselectAllPhotos as deselectAllPhotosAction,
  setIsFromGallery 
} from "./photoSelectionSlice"
import { createTimelineAlbum as createTimelineAlbumAPI } from "@/features/timeline-album/api/timelineAlbumApi"
import { createTierAlbum as createTierAlbumAPI } from "@/features/tier-album/api/tierAlbumApi"
import { isTranslatable } from "@/shared/lib/tagTranslation"

// Masonry 레이아웃 훅 - 개선된 균등 분배 알고리즘
export const useMasonryLayout = (photos: GalleryPhoto[], columnCount: number) => {
  const columns = useMemo(() => {
    if (photos.length === 0) return []

    // 컬럼별 높이 추적 (더 정확한 계산)
    const columnHeights = new Array(columnCount).fill(0)
    const newColumns: GalleryPhoto[][] = Array.from({ length: columnCount }, () => [])

    photos.forEach((photo) => {
      // 실제 렌더링될 높이 계산 (aspectRatio 기반)
      // 컨테이너 너비를 고려한 실제 높이 계산 (gap 2px * (columnCount-1) = 총 gap)
      const totalGapWidth = 8 * (columnCount - 1) // gap-2 = 8px
      const availableWidth = window.innerWidth - 64 // 좌우 패딩 고려
      const estimatedWidth = (availableWidth - totalGapWidth) / columnCount
      const actualHeight = estimatedWidth / photo.aspectRatio
      
      // 가장 짧은 컬럼 찾기 (더 나은 균등 분배를 위해 여러 후보 고려)
      const minHeight = Math.min(...columnHeights)
      const shortestColumns = columnHeights
        .map((height, index) => ({ height, index }))
        .filter(col => col.height <= minHeight + 50) // 50px 허용 범위
        .sort((a, b) => newColumns[a.index].length - newColumns[b.index].length) // 사진 개수가 적은 컬럼 우선
      
      const shortestColumnIndex = shortestColumns[0].index
      newColumns[shortestColumnIndex].push(photo)
      
      // 16px gap 포함하여 높이 누적
      columnHeights[shortestColumnIndex] += actualHeight + 16
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
  const [selectedMemberNames, setSelectedMemberNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [columnCount, setColumnCount] = useState(4)

  // 선택 모드 관련 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false)

  // 모든 태그 추출 - 딕셔너리에 있는 태그만 (메모이제이션으로 리렌더링 최적화)
  const allTags = useMemo(() => {
    return Array.from(new Set(
      allPhotos.flatMap((photo) => photo.tags.filter(tag => isTranslatable(tag)))
    )).sort()
  }, [allPhotos])

  // Redux에서 이미 GalleryPhoto 배열로 관리되므로 별도 변환 불필요
  const selectedPhotoData = selectedPhotos

  // 반응형 컬럼 수 계산 (디바운스 적용)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const updateColumnCount = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        let newColumnCount
        if (width < 640) newColumnCount = 2
        else if (width < 1024) newColumnCount = 3
        else if (width < 1280) newColumnCount = 4
        else newColumnCount = 5
        
        // 컬럼 수가 실제로 변경될 때만 업데이트
        setColumnCount(prev => prev !== newColumnCount ? newColumnCount : prev)
      }, 150) // 150ms 디바운스
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => {
      window.removeEventListener("resize", updateColumnCount)
      clearTimeout(timeoutId)
    }
  }, [])

  // 태그 및 사람 필터링 (useMemo로 변경하여 무한 루프 방지)
  const filteredPhotos = useMemo(() => {
    if (selectedTags.length === 0 && selectedMemberNames.length === 0) {
      return allPhotos
    } else {
      return allPhotos.filter((photo) => {
        // 태그 조건 확인
        const tagMatches = selectedTags.length === 0 || selectedTags.some((selectedTag) => {
          // 사진의 태그 중 딕셔너리에 있는 태그만 추출한 후 매칭
          const photoTagsInDict = photo.tags.filter(photoTag => isTranslatable(photoTag))
          return photoTagsInDict.includes(selectedTag)
        })
        
        // 사람 태그 조건 확인
        const memberMatches = selectedMemberNames.length === 0 || selectedMemberNames.some((selectedMember) => {
          return (photo.memberNicknames || []).includes(selectedMember)
        })
        
        // 둘 다 선택된 경우는 AND 조건, 하나만 선택된 경우는 해당 조건만 확인
        if (selectedTags.length > 0 && selectedMemberNames.length > 0) {
          return tagMatches && memberMatches
        } else {
          return tagMatches && memberMatches
        }
      })
    }
  }, [selectedTags, selectedMemberNames, allPhotos])

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

  // 사람 태그 토글
  const toggleMemberName = (memberName: string) => {
    setSelectedMemberNames((prev) => 
      prev.includes(memberName) ? prev.filter((m) => m !== memberName) : [...prev, memberName]
    )
  }

  // 모든 사람 태그 해제
  const clearAllMemberNames = () => {
    setSelectedMemberNames([])
  }

  // 모든 필터 해제 (태그 + 사람)
  const clearAllFilters = () => {
    setSelectedTags([])
    setSelectedMemberNames([])
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

  // 전체 사진 선택
  const selectAllPhotos = () => {
    if (!isSelectionMode) return
    dispatch(selectAllPhotosAction(filteredPhotos))
  }

  // 전체 사진 선택 해제
  const deselectAllPhotos = () => {
    if (!isSelectionMode) return
    dispatch(deselectAllPhotosAction())
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
    selectedMemberNames,
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
    toggleMemberName,
    clearAllMemberNames,
    clearAllFilters,
    enterSelectionMode,
    exitSelectionMode,
    togglePhotoSelection,
    selectAllPhotos,
    deselectAllPhotos,
    deleteSelectedPhotos,
    createTimelineAlbum,
    createTierAlbum,
    loadMorePhotos,
    setIsPhotosExpanded,
    setGalleryData,
  }
}