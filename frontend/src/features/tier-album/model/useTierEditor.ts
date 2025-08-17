"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/shared/config/store"
import { clearSelectedPhotos, setIsFromGallery } from "@/features/photo-gallery/model/photoSelectionSlice"
import type { Photo, DragPhotoData } from "@/entities/photo"
import type { TierData, DragOverPosition, TierConfig } from "@/features/tier-battle"
import { getTierAlbum, updateTierAlbum } from "../api/tierAlbumApi"
import { removePhotosFromTierAlbum } from "../api/tierAlbumPhotos"
import { 
  saveEditingState, 
  restoreEditingState, 
  clearEditingState, 
  type TierEditingState 
} from "@/shared/lib/editingStateManager"
import type { EditingAlbumInfo } from "@/shared/ui/modal/AlbumInfoEditModal"
import { 
  convertApiToEditor, 
  convertEditorToApi, 
  selectThumbnailId,
  convertGalleryPhotosToEditor 
} from "../lib/tierDataConverter"
import { 
  validateDragData,
  isValidTierSource,
  isSidebarSource,
  createDragData,
  logDragError
} from "@/shared/lib/dragDataValidator"

// 티어 설정
const tiers: TierConfig[] = [
  { label: "S", color: "from-amber-300 to-yellow-400" },
  { label: "A", color: "from-sky-300 to-blue-500" },
  { label: "B", color: "from-teal-300 to-emerald-500" },
  { label: "C", color: "from-orange-300 to-rose-400" },
  { label: "D", color: "from-gray-300 to-slate-500" },
]

/**
 * 티어 앨범 편집을 위한 통합 상태 관리 훅
 * useTierAlbum, useAlbumState, useTierGrid를 하나로 통합
 */
export function useTierEditor(groupId: string, tierAlbumId: string) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { selectedPhotos, isFromGallery } = useSelector((state: RootState) => state.photoSelection)

  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false)
  
  // 편집용 데이터 상태들
  const [tierPhotos, setTierPhotos] = useState<TierData>({
    S: [], A: [], B: [], C: [], D: []
  })
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  
  // 앨범 정보 상태
  const [albumInfo, setAlbumInfo] = useState<EditingAlbumInfo | null>(null)
  const [coverImage, setCoverImage] = useState<Photo | null>(null)
  
  // 드래그&드롭 상태
  const [dragOverPosition, setDragOverPosition] = useState<DragOverPosition | null>(null)
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null)
  
  // API 데이터 조회
  const { data: tierAlbumData, isLoading, error } = useQuery({
    queryKey: ['tierAlbum', groupId, tierAlbumId],
    queryFn: () => getTierAlbum(parseInt(groupId), parseInt(tierAlbumId)),
    enabled: !!groupId && !!tierAlbumId,
  })

  // API 데이터 로드 시 앨범 정보 초기화
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

  // 편집 모드 진입 시 데이터 초기화
  useEffect(() => {
    if (!isEditMode) return


    // 1. 갤러리에서 온 경우 (새 앨범 생성)
    if (isFromGallery && selectedPhotos.length > 0) {
      const photosToUse = convertGalleryPhotosToEditor(selectedPhotos)
      setAvailablePhotos(photosToUse)
      setTierPhotos({ S: [], A: [], B: [], C: [], D: [] })
      return
    }

    // 2. 갤러리에서 돌아온 경우 (편집 상태 복원)
    const savedState = restoreEditingState<TierEditingState>('tier')
    if (savedState) {
      setAlbumInfo(savedState.albumInfo)
      setTierPhotos(savedState.tierPhotos)
      setAvailablePhotos(savedState.availablePhotos)
      clearEditingState('tier') // 복원 후 정리
      return
    }

    // 3. 기존 앨범 편집
    if (tierAlbumData?.photos) {
      const { tierPhotos: convertedTierPhotos, availablePhotos: convertedAvailablePhotos } = 
        convertApiToEditor(tierAlbumData)
      
      setTierPhotos(convertedTierPhotos)
      setAvailablePhotos(convertedAvailablePhotos)
      return
    }
  }, [isEditMode, tierAlbumData, isFromGallery, selectedPhotos])

  // 편집 모드 토글
  const toggleEditMode = useCallback(() => {
    if (isEditMode && isFromGallery) {
      // 편집 완료 시 선택 상태 초기화
      dispatch(clearSelectedPhotos())
      dispatch(setIsFromGallery(false))
    }
    
    // 편집 모드 진입 시 갤러리 상태 초기화 (기존 앨범 편집인 경우)
    if (!isEditMode && !isFromGallery) {
      dispatch(clearSelectedPhotos())
      dispatch(setIsFromGallery(false))
    }
    
    setIsEditMode(!isEditMode)
  }, [isEditMode, isFromGallery, dispatch])

  // 저장 처리
  const saveChanges = useCallback(async () => {
    if (!tierAlbumData || !albumInfo) return

    try {
      const photosToSave = convertEditorToApi(tierPhotos)
      const thumbnailId = selectThumbnailId(tierPhotos)

      await updateTierAlbum(parseInt(groupId), parseInt(tierAlbumId), {
        name: albumInfo.name || tierAlbumData.title || "티어 앨범",
        description: albumInfo.description || tierAlbumData.description || "",
        thumbnailId: thumbnailId,
        photos: photosToSave
      })

      // 저장 후 최신 데이터 새로고침
      await queryClient.invalidateQueries({
        queryKey: ['tierAlbum', groupId, tierAlbumId]
      })

      // 편집 모드 종료
      setIsEditMode(false)
      
      // 갤러리 상태 정리
      if (isFromGallery) {
        dispatch(clearSelectedPhotos())
        dispatch(setIsFromGallery(false))
      }

      console.log('티어 앨범 저장 완료')
    } catch (error) {
      console.error("티어 앨범 저장 실패:", error)
      throw error
    }
  }, [tierAlbumData, albumInfo, tierPhotos, groupId, tierAlbumId, queryClient, isFromGallery, dispatch])

  // 갤러리에서 사진 추가
  const addPhotosFromGallery = useCallback(() => {
    // 현재 편집 상태 저장
    const currentState: TierEditingState = {
      albumInfo: {
        name: albumInfo?.name || '',
        description: albumInfo?.description || ''
      },
      tierPhotos: {
        S: tierPhotos.S || [],
        A: tierPhotos.A || [],
        B: tierPhotos.B || [],
        C: tierPhotos.C || [],
        D: tierPhotos.D || [],
      },
      availablePhotos: availablePhotos
    }
    
    saveEditingState('tier', currentState)
    
    // 갤러리로 이동
    window.location.href = `/group/${groupId}?gallery=true&mode=add&target=tier&albumId=${tierAlbumId}&returnEdit=true`
  }, [albumInfo, tierPhotos, availablePhotos, groupId, tierAlbumId])

  // 사진 삭제
  const deletePhotos = useCallback(async (photoIds: number[]) => {
    try {
      console.log('티어 앨범에서 사진 삭제:', photoIds)
      
      // API 호출로 사진 삭제
      await removePhotosFromTierAlbum(parseInt(groupId), parseInt(tierAlbumId), photoIds)
      
      // 로컬 상태 업데이트: availablePhotos에서 삭제
      setAvailablePhotos(prev => prev.filter(photo => !photoIds.includes(photo.id)))
      
      // 티어에서도 삭제된 사진들 제거
      setTierPhotos(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(tier => {
          updated[tier] = updated[tier].filter(photo => photo && photo.id && !photoIds.includes(photo.id))
        })
        return updated
      })
      
      // 대표이미지도 삭제된 사진이면 제거
      if (coverImage && photoIds.includes(coverImage.id)) {
        setCoverImage(null)
      }
      
      console.log(`${photoIds.length}장의 사진을 티어 앨범에서 삭제 완료`)
      
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      throw error
    }
  }, [groupId, tierAlbumId, coverImage])

  // 앨범 정보 업데이트
  const updateAlbumInfo = useCallback((updates: Partial<EditingAlbumInfo>) => {
    setAlbumInfo(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  // 드래그 핸들러들
  const handleDragStart = useCallback((e: React.DragEvent, photo: Photo, source: string) => {
    const dragDataString = createDragData(
      photo.id,
      source as any,
      photo.originalUrl,
      photo.thumbnailUrl,
      photo.name
    )
    e.dataTransfer.setData('text/plain', dragDataString)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingPhotoId(photo.id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingPhotoId(null)
    setDragOverPosition(null)
  }, [])

  const handleDragOverTierArea = useCallback((e: React.DragEvent, tier: string) => {
    e.preventDefault()
    setDragOverPosition({ tier, index: (tierPhotos[tier] || []).length })
  }, [tierPhotos])

  const handleDragOverPosition = useCallback((
    e: React.DragEvent,
    tier: string,
    index: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const isLeftHalf = mouseX < rect.width / 2
    const targetIndex = isLeftHalf ? index : index + 1
    setDragOverPosition({ tier, index: targetIndex })
  }, [])

  // 드롭 핸들러들 (소스별로 분리)
  const handleSidebarToTier = useCallback((photo: Photo, targetTier: string, targetIndex?: number) => {
    // availablePhotos에서 사진 제거
    setAvailablePhotos(prev => prev.filter(p => p.id !== photo.id))
    
    // 티어에 사진 추가
    setTierPhotos(prev => {
      const newTierPhotos = [...prev[targetTier]]
      const insertIndex = targetIndex ?? newTierPhotos.length
      newTierPhotos.splice(insertIndex, 0, photo)
      return {
        ...prev,
        [targetTier]: newTierPhotos
      }
    })
  }, [])

  const handleTierToTier = useCallback((photo: Photo, sourceTier: string, targetTier: string, targetIndex: number) => {
    setTierPhotos(prev => {
      const newTiers = { ...prev }
      // 소스 티어에서 제거
      newTiers[sourceTier] = newTiers[sourceTier].filter(p => p.id !== photo.id)
      // 타겟 티어에 추가
      const targetArray = [...newTiers[targetTier]]
      targetArray.splice(targetIndex, 0, photo)
      newTiers[targetTier] = targetArray
      return newTiers
    })
  }, [])

  const handleTierToSidebar = useCallback((photo: Photo, fromTier: string) => {
    // 티어에서 사진 제거
    setTierPhotos(prev => ({
      ...prev,
      [fromTier]: prev[fromTier].filter(p => p.id !== photo.id)
    }))
    
    // availablePhotos에 추가 (중복 방지)
    setAvailablePhotos(prev => {
      if (!prev.find(p => p.id === photo.id)) {
        return [...prev, photo]
      }
      return prev
    })
  }, [])

  const handleDropAtPosition = useCallback((e: React.DragEvent, targetTier: string, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 드롭 즉시 상태 초기화
    setDragOverPosition(null)
    setDraggingPhotoId(null)

    // 드래그 데이터 검증
    const validation = validateDragData(e)
    if (!validation.isValid || !validation.data) {
      logDragError('TierEditor handleDropAtPosition', validation.error!, e.dataTransfer.getData("text/plain"))
      return
    }

    const { photoId, source } = validation.data
    
    // 사진 찾기
    const draggedPhoto = isSidebarSource(source)
      ? availablePhotos.find(p => p.id === photoId)
      : isValidTierSource(source)
      ? tierPhotos[source]?.find(p => p.id === photoId)
      : null

    if (!draggedPhoto) {
      logDragError('TierEditor handleDropAtPosition', `사진을 찾을 수 없습니다: ${photoId}`, JSON.stringify(validation.data))
      return
    }

    // 같은 위치로의 이동 방지
    if (isValidTierSource(source)) {
      const sourceIndex = tierPhotos[source]?.findIndex(p => p.id === photoId) ?? -1
      if (source === targetTier && (targetIndex === sourceIndex || targetIndex === sourceIndex + 1)) {
        return
      }
    }

    // 소스별 처리
    if (isSidebarSource(source)) {
      handleSidebarToTier(draggedPhoto, targetTier, targetIndex)
    } else if (isValidTierSource(source)) {
      handleTierToTier(draggedPhoto, source, targetTier, targetIndex)
    }
  }, [availablePhotos, tierPhotos, handleSidebarToTier, handleTierToTier])

  const handleDropTierArea = useCallback((e: React.DragEvent, targetTier: string) => {
    const tierLength = (tierPhotos[targetTier] || []).length
    handleDropAtPosition(e, targetTier, tierLength)
  }, [tierPhotos, handleDropAtPosition])

  const handleSidebarDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    // 드래그 데이터 검증
    const validation = validateDragData(e)
    if (!validation.isValid || !validation.data) {
      logDragError('TierEditor handleSidebarDrop', validation.error!, e.dataTransfer.getData("text/plain"))
      return
    }

    const { photoId, source } = validation.data
    
    // 티어에서 온 사진만 처리
    if (isValidTierSource(source)) {
      const photo = tierPhotos[source]?.find(p => p.id === photoId)
      if (photo) {
        handleTierToSidebar(photo, source)
      }
    }
    
    // 상태 초기화
    setDragOverPosition(null)
    setDraggingPhotoId(null)
  }, [tierPhotos, handleTierToSidebar])

  // 사이드바 통신을 위한 window 이벤트 (편집 모드일 때만)
  useEffect(() => {
    if (!isEditMode) return

    // 사이드바로 실시간 데이터 전송
    const updateSidebar = () => {
      window.dispatchEvent(new CustomEvent('tierAvailablePhotosUpdate', { 
        detail: availablePhotos 
      }))
    }

    // 사이드바 마운트 시 데이터 전송
    const handleSidebarMounted = () => {
      updateSidebar()
    }

    // 사이드바에서 드롭 이벤트 처리
    const handleSidebarDropEvent = (event: CustomEvent) => {
      const dragData = event.detail as DragPhotoData
      
      if (isValidTierSource(dragData.source)) {
        const photo = tierPhotos[dragData.source]?.find(p => p.id === dragData.photoId)
        if (photo) {
          handleTierToSidebar(photo, dragData.source)
        }
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('tierSidebarMounted', handleSidebarMounted)
    window.addEventListener('tierSidebarDrop', handleSidebarDropEvent as EventListener)
    
    // 즉시 데이터 전송
    updateSidebar()
    
    return () => {
      window.removeEventListener('tierSidebarMounted', handleSidebarMounted)
      window.removeEventListener('tierSidebarDrop', handleSidebarDropEvent as EventListener)
    }
  }, [isEditMode, availablePhotos, tierPhotos, handleTierToSidebar])

  return {
    // 기본 상태
    isLoading,
    error,
    tierAlbumData,
    
    // 편집 상태
    isEditMode,
    tierPhotos,
    setTierPhotos,
    availablePhotos,
    setAvailablePhotos,
    
    // 앨범 정보
    albumInfo,
    coverImage,
    setCoverImage,
    
    // 드래그&드롭 상태
    dragOverPosition,
    setDragOverPosition,
    draggingPhotoId,
    setDraggingPhotoId,
    
    // 설정
    tiers,
    
    // 액션들
    toggleEditMode,
    saveChanges,
    addPhotosFromGallery,
    deletePhotos,
    updateAlbumInfo,
    
    // 드래그&드롭 핸들러들
    handleDragStart,
    handleDragEnd,
    handleDragOverTierArea,
    handleDragOverPosition,
    handleDropAtPosition,
    handleDropTierArea,
    handleSidebarDrop,
    
    // 개별 이동 함수들 (하위 호환성)
    moveTierToSidebar: handleTierToSidebar,
    moveSidebarToTier: handleSidebarToTier,
  }
}