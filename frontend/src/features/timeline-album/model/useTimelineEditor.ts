"use client"

import { useState, useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { TimelineAlbum, TimelineSection } from "@/entities/album"
import { Photo } from "@/entities/photo"
import { useTimelineAlbum } from "./useTimelineAlbum"
import { saveEditingState, restoreEditingState, clearEditingState, TimelineEditingState as SavedEditingState } from "@/shared/lib/editingStateManager"

// 편집 중인 앨범 정보 타입
export interface EditingAlbumInfo {
  name: string
  description: string
  startDate: string
  endDate: string
  thumbnailId: number
  coverImage: Photo | null
}

// 편집 중인 섹션 타입 (인덱스 보존을 위해 null 허용)
export interface EditingSection extends Omit<TimelineSection, 'photos'> {
  photos: (Photo | null)[]
}

// 편집 상태 타입
export interface TimelineEditingState {
  albumInfo: EditingAlbumInfo
  sections: EditingSection[]
  unusedPhotos: Photo[]
}

export function useTimelineEditor(groupId: string, albumId: string) {
  const queryClient = useQueryClient()
  
  // 서버 데이터 조회 (읽기 전용)
  const { 
    timelineAlbum, 
    loading, 
    updateTimelineAlbum, 
    updateTimelineAlbumAsync,
    isUpdating,
    refetchTimeline 
  } = useTimelineAlbum(groupId, albumId)
  
  // 편집 상태 (로컬)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingState, setEditingState] = useState<TimelineEditingState | null>(null)
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])

  // 서버 데이터를 편집 상태로 변환하는 함수
  const convertToEditingState = useCallback((album: TimelineAlbum): TimelineEditingState => {
    // 사진 데이터 정규화 (서버 스키마에 맞게 수정)
    const normalizePhotos = (photos: any[]): Photo[] => {
      return photos.map((photo: any) => {
        const photoId = photo.photoId || photo.id // 서버는 photoId 사용
        return {
          id: photoId,
          src: photo.thumbnailUrl || photo.originalUrl || '/placeholder/photo-placeholder.svg',
          thumbnailUrl: photo.thumbnailUrl,
          originalUrl: photo.originalUrl,
          name: photo.name || photo.title || `사진 #${photoId}`
        }
      }).filter(photo => photo.id && photo.id !== 0)
    }

    // 섹션 변환 (서버 스키마에 맞게 수정)
    const editingSections: EditingSection[] = album.sections.length > 0 
      ? album.sections.map(section => {
          const normalizedPhotos: (Photo | null)[] = Array(3).fill(null)
          
          if (section.photos && Array.isArray(section.photos)) {
            section.photos.forEach((photo: any, idx: number) => {
              if (photo && idx < 3) {
                const photoId = photo.photoId || photo.id // 서버는 photoId 사용
                normalizedPhotos[idx] = {
                  id: photoId,
                  thumbnailUrl: photo.thumbnailUrl || '/placeholder/photo-placeholder.svg',
                  originalUrl: photo.originalUrl || '/placeholder/photo-placeholder.svg',
                  name: photo.name || photo.title || `사진 #${photoId}`
                }
              }
            })
          }
          
          // photoIds 배열 생성 (서버 응답에 없으므로 photos에서 추출)
          const photoIds = normalizedPhotos
            .filter((photo): photo is Photo => photo !== null)
            .map(photo => photo.id)
          
          return {
            id: section.sectionId || section.id, // 서버는 sectionId 사용
            name: section.name,
            description: section.description,
            startDate: section.startDate,
            endDate: section.endDate,
            photoIds: photoIds, // 계산된 photoIds
            photos: normalizedPhotos
          }
        })
      : [{
          id: Date.now(),
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          photoIds: [],
          photos: Array(3).fill(null)
        }]

    // 대표이미지 정보 추출 (서버에서 설정된 대표이미지가 있으면 복원)
    const hasCoverImage = album.thumbnailUrl && 
      album.thumbnailUrl !== "/placeholder.svg" && 
      album.thumbnailUrl !== "/placeholder/photo-placeholder.svg"
    
    const coverImage: Photo | null = hasCoverImage ? {
      id: album.thumbnailId || 0, // 실제 thumbnailId 사용
      thumbnailUrl: album.thumbnailUrl,
      originalUrl: album.originalUrl || album.thumbnailUrl,
      name: `${album.name} 대표이미지`
    } : null

    const unusedPhotos = normalizePhotos(album.unusedPhotos || [])
    
    console.log('🔄 convertToEditingState 실행:', {
      albumName: album.name,
      sectionsCount: editingSections.length,
      unusedPhotosCount: unusedPhotos.length,
      unusedPhotos: unusedPhotos.map(p => ({ id: p.id, name: p.name }))
    })

    return {
      albumInfo: {
        name: album.name,
        description: album.description,
        startDate: album.startDate,
        endDate: album.endDate,
        thumbnailId: hasCoverImage ? (album.thumbnailId || 0) : 0, // 서버에 설정된 thumbnailId 복원
        coverImage: coverImage
      },
      sections: editingSections,
      unusedPhotos: unusedPhotos
    }
  }, [])

  // 편집 모드 시작 - 저장된 상태 복원 시도
  const startEditing = useCallback(() => {
    if (timelineAlbum) {
      // 먼저 저장된 편집 상태 복원 시도 (갤러리에서 돌아온 경우 이미 삭제됨)
      const savedState = restoreEditingState<SavedEditingState>('timeline')
      
      if (savedState) {
        console.log('💾 저장된 편집 상태 복원됨')
        // 저장된 상태를 현재 에디터 형식으로 변환
        const restoredEditingState: TimelineEditingState = {
          albumInfo: {
            name: savedState.albumInfo?.name || '',
            description: savedState.albumInfo?.description || '',
            startDate: savedState.albumInfo?.startDate || '',
            endDate: savedState.albumInfo?.endDate || '',
            thumbnailId: savedState.albumInfo?.thumbnailId || 0,
            coverImage: savedState.albumInfo?.coverImage || null
          },
          sections: savedState.sections,
          unusedPhotos: savedState.availablePhotos
        }
        setEditingState(restoredEditingState)
        // 복원 후 저장된 상태는 정리
        clearEditingState('timeline')
      } else {
        // 저장된 상태가 없으면 최신 서버 데이터로 초기화
        // (갤러리에서 돌아온 경우 새로 추가된 사진들이 포함됨)
        console.log('🔄 최신 서버 데이터로 편집 상태 초기화 (갤러리 추가 사진 포함)')
        setEditingState(convertToEditingState(timelineAlbum))
      }
      
      setIsEditMode(true)
    }
  }, [timelineAlbum, convertToEditingState])

  // 편집 모드 종료 (모든 변경사항 취소하고 원래 상태로 복원)
  const cancelEditing = useCallback(() => {
    setIsEditMode(false)
    setEditingState(null)
    // 원본 데이터로 복원하려면 캐시를 다시 불러오거나 자동으로 displayData가 원본으로 돌아감
  }, [])

  // editingState 변경 시 availablePhotos 자동 계산
  useEffect(() => {
    if (!editingState) {
      setAvailablePhotos([])
      return
    }
    
    // 섹션에서 사용 중인 사진 ID들 수집
    const usedPhotoIds = new Set<number>()
    editingState.sections.forEach(section => {
      section.photos.forEach(photo => {
        if (photo) usedPhotoIds.add(photo.id)
      })
    })
    
    // 대표이미지는 복사 개념이므로 availablePhotos에서 제외하지 않음
    
    // 사용되지 않은 사진들만 설정
    const newAvailablePhotos = editingState.unusedPhotos.filter(photo => !usedPhotoIds.has(photo.id))
    
    console.log('📸 availablePhotos 자동 계산:', {
      totalUnusedPhotos: editingState.unusedPhotos.length,
      usedPhotoIds: Array.from(usedPhotoIds),
      finalAvailablePhotos: newAvailablePhotos.length,
      photos: newAvailablePhotos.map(p => ({ id: p.id, name: p.name }))
    })
    
    setAvailablePhotos(newAvailablePhotos)
  }, [editingState])

  // photoIds를 photos 배열에서 실시간 계산하는 헬퍼 함수
  const syncPhotoIds = useCallback((photos: (Photo | null)[]): number[] => {
    return photos
      .filter((photo): photo is Photo => {
        if (photo === null) return false
        if (typeof photo.id !== 'number' || photo.id <= 0) return false
        if (!photo.thumbnailUrl && !photo.originalUrl) return false
        return true
      })
      .map(photo => photo.id)
  }, [])

  // 갤러리에서 섹션으로 사진 이동
  const moveSidebarToSection = useCallback((photoId: number, sectionIndex: number, imageIndex: number) => {
    setEditingState(prev => {
      if (!prev) return prev

      const photo = prev.unusedPhotos.find(p => p.id === photoId)
      if (!photo || !prev.sections[sectionIndex]) return prev

      const newSections = [...prev.sections]
      const newSection = { ...newSections[sectionIndex] }
      newSection.photos = [...newSection.photos]
      
      // 해당 위치에 사진 배치
      newSection.photos[imageIndex] = photo
      
      // photoIds 배열 실시간 동기화
      newSection.photoIds = syncPhotoIds(newSection.photos)
      
      newSections[sectionIndex] = newSection

      // unusedPhotos에서 사용된 사진 제거
      const newUnusedPhotos = prev.unusedPhotos.filter(p => p.id !== photoId)

      const newState = {
        ...prev,
        sections: newSections,
        unusedPhotos: newUnusedPhotos
      }

      // Tanstack Query 캐시도 즉시 업데이트
      queryClient.setQueryData(['timeline-album', groupId, albumId], (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          unusedPhotos: newUnusedPhotos.map(p => ({
            photoId: p.id,
            originalUrl: p.originalUrl,
            thumbnailUrl: p.thumbnailUrl,
            name: p.name
          }))
        }
      })

      return newState
    })
    
    // availablePhotos에서 해당 사진 즉시 제거
    setAvailablePhotos(prev => prev.filter(p => p.id !== photoId))
  }, [syncPhotoIds, queryClient, groupId, albumId])

  // 섹션에서 갤러리로 사진 이동
  const moveSectionToSidebar = useCallback((sectionIndex: number, imageIndex: number) => {
    let photoToRemove: Photo | null = null
    
    setEditingState(prev => {
      if (!prev) return prev

      const section = prev.sections[sectionIndex]
      if (!section || !section.photos[imageIndex]) return prev

      photoToRemove = section.photos[imageIndex]
      const newSections = [...prev.sections]
      const newSection = { ...newSections[sectionIndex] }
      newSection.photos = [...newSection.photos]
      
      // 해당 위치의 사진 제거 (null로 설정)
      newSection.photos[imageIndex] = null
      
      // photoIds 배열 실시간 동기화
      newSection.photoIds = syncPhotoIds(newSection.photos)
      
      newSections[sectionIndex] = newSection

      // 제거된 사진을 unusedPhotos에 다시 추가
      const newUnusedPhotos = [...prev.unusedPhotos]
      if (photoToRemove && !newUnusedPhotos.some(p => p.id === photoToRemove.id)) {
        newUnusedPhotos.push(photoToRemove)
      }

      const newState = {
        ...prev,
        sections: newSections,
        unusedPhotos: newUnusedPhotos
      }

      // Tanstack Query 캐시도 즉시 업데이트
      queryClient.setQueryData(['timeline-album', groupId, albumId], (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          unusedPhotos: newUnusedPhotos.map(p => ({
            photoId: p.id,
            originalUrl: p.originalUrl,
            thumbnailUrl: p.thumbnailUrl,
            name: p.name
          }))
        }
      })

      return newState
    })
    
    // availablePhotos에 해당 사진 즉시 추가
    if (photoToRemove) {
      setAvailablePhotos(prev => {
        // 중복 체크 후 추가
        if (!prev.some(p => p.id === photoToRemove!.id)) {
          return [...prev, photoToRemove!]
        }
        return prev
      })
    }
  }, [syncPhotoIds, queryClient, groupId, albumId])

  // 섹션 내/섹션 간 이미지 위치 교환 (자연스러운 스왑)
  const moveWithinOrBetweenSections = useCallback((
    fromSectionIndex: number, 
    fromImageIndex: number, 
    toSectionIndex: number, 
    toImageIndex: number
  ) => {
    setEditingState(prev => {
      if (!prev) return prev
      
      // 같은 위치면 아무것도 하지 않음
      if (fromSectionIndex === toSectionIndex && fromImageIndex === toImageIndex) {
        return prev
      }

      const newSections = [...prev.sections]
      
      if (fromSectionIndex === toSectionIndex) {
        // 같은 섹션 내에서 위치 교환
        const section = { ...newSections[fromSectionIndex] }
        section.photos = [...section.photos]
        
        const photoA = section.photos[fromImageIndex]
        const photoB = section.photos[toImageIndex]
        
        // 위치 교환
        section.photos[fromImageIndex] = photoB
        section.photos[toImageIndex] = photoA
        
        // photoIds 동기화
        section.photoIds = syncPhotoIds(section.photos)
        newSections[fromSectionIndex] = section
      } else {
        // 다른 섹션 간 위치 교환
        const fromSection = { ...newSections[fromSectionIndex] }
        const toSection = { ...newSections[toSectionIndex] }
        fromSection.photos = [...fromSection.photos]
        toSection.photos = [...toSection.photos]
        
        const photoA = fromSection.photos[fromImageIndex]
        const photoB = toSection.photos[toImageIndex]
        
        // 위치 교환
        fromSection.photos[fromImageIndex] = photoB
        toSection.photos[toImageIndex] = photoA
        
        // photoIds 동기화
        fromSection.photoIds = syncPhotoIds(fromSection.photos)
        toSection.photoIds = syncPhotoIds(toSection.photos)
        
        newSections[fromSectionIndex] = fromSection
        newSections[toSectionIndex] = toSection
      }

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [syncPhotoIds])

  // 대표이미지 설정
  const setCoverImage = useCallback((photoId: number, photo: Photo) => {
    setEditingState(prev => {
      if (!prev) return prev

      return {
        ...prev,
        albumInfo: {
          ...prev.albumInfo,
          thumbnailId: photoId,
          coverImage: photo
        }
      }
    })
  }, [])

  // 섹션 업데이트
  const updateSection = useCallback((sectionIndex: number, field: string, value: string) => {
    setEditingState(prev => {
      if (!prev) return prev

      const newSections = [...prev.sections]
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        [field]: value
      }

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // 섹션 추가
  const addSection = useCallback(() => {
    setEditingState(prev => {
      if (!prev) return prev

      const newSection: EditingSection = {
        id: Date.now(),
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        photoIds: [],
        photos: Array(3).fill(null)
      }

      return {
        ...prev,
        sections: [...prev.sections, newSection]
      }
    })
  }, [])

  // 섹션 삭제
  const deleteSection = useCallback((sectionIndex: number) => {
    setEditingState(prev => {
      if (!prev || prev.sections.length <= 1) return prev

      const newSections = prev.sections.filter((_, index) => index !== sectionIndex)

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // 앨범 정보 업데이트
  const updateAlbumInfo = useCallback((updates: Partial<EditingAlbumInfo>) => {
    setEditingState(prev => {
      if (!prev) return prev

      return {
        ...prev,
        albumInfo: {
          ...prev.albumInfo,
          ...updates
        }
      }
    })
  }, [])
  
  // 사진 삭제 후 상태 업데이트
  const removePhotosFromState = useCallback((photoIds: number[]) => {
    setEditingState(prev => {
      if (!prev) return prev
      
      // 섹션에서 삭제된 사진들 null로 치환
      const updatedSections = prev.sections.map(section => ({
        ...section,
        photos: section.photos.map(photo => 
          photo && photoIds.includes(photo.id) ? null : photo
        )
      }))
      
      // unusedPhotos에서 삭제된 사진들 제거
      const updatedUnusedPhotos = prev.unusedPhotos.filter(photo => 
        !photoIds.includes(photo.id)
      )
      
      // 대표이미지도 삭제된 사진이면 null로 설정
      let updatedCoverImage = prev.albumInfo.coverImage
      if (updatedCoverImage && photoIds.includes(updatedCoverImage.id)) {
        updatedCoverImage = null
      }
      
      return {
        ...prev,
        sections: updatedSections,
        unusedPhotos: updatedUnusedPhotos,
        albumInfo: {
          ...prev.albumInfo,
          coverImage: updatedCoverImage
        }
      }
    })
  }, [])

  // 앨범 정보만 저장 (편집 모드 유지)
  const saveAlbumInfoOnly = useCallback(async () => {
    if (!editingState || !timelineAlbum) {
      throw new Error('저장할 데이터가 없습니다')
    }
    
    // 필수 검증
    if (!editingState.albumInfo.name?.trim()) {
      throw new Error('앨범 제목을 입력해주세요')
    }
    
    try {
      // 대표이미지 ID 처리
      let thumbnailId = null
      if (editingState.albumInfo.coverImage?.id && editingState.albumInfo.coverImage.id > 0) {
        thumbnailId = editingState.albumInfo.coverImage.id
      }
      
      // 기존 섹션 데이터는 그대로 유지하고 앨범 정보만 업데이트
      const validSections = editingState.sections.map(section => {
        // 서버에 존재하는 섹션인지 확인 (timelineAlbum.sections에 해당 ID가 있는지)
        const isExistingSection = timelineAlbum?.sections.some(originalSection => originalSection.id === section.id)
        
        return {
          ...(isExistingSection && { id: section.id }), // 서버에 있는 섹션만 ID 포함
          name: section.name || '',
          description: section.description || '',
          startDate: section.startDate || '',
          endDate: section.endDate || '',
          photoIds: section.photos
            .filter(photo => photo !== null)
            .map(photo => photo!.id)
        }
      })
      
      // 서버 업데이트 (편집 모드는 유지)
      const updateData = {
        name: editingState.albumInfo.name,
        description: editingState.albumInfo.description || '',
        thumbnailId,
        startDate: editingState.albumInfo.startDate || '',
        endDate: editingState.albumInfo.endDate || '',
        sections: validSections
      }
      
      await updateTimelineAlbumAsync(updateData)
      
      // 편집 모드는 유지하고 데이터만 다시 fetch
      await refetchTimeline()
      
    } catch (error) {
      console.error('앨범 정보 저장 실패:', error)
      throw error
    }
  }, [editingState, timelineAlbum, updateTimelineAlbumAsync, refetchTimeline])

  // 특정 앨범 정보로 저장 (모달용 - React 상태 업데이트 비동기 이슈 해결)
  const saveAlbumInfoWithData = useCallback(async (albumInfoData: EditingAlbumInfo) => {
    if (!editingState || !timelineAlbum) {
      throw new Error('저장할 데이터가 없습니다')
    }
    
    // 필수 검증
    if (!albumInfoData.name?.trim()) {
      throw new Error('앨범 제목을 입력해주세요')
    }
    
    try {
      // 대표이미지 ID 처리
      let thumbnailId = null
      if (albumInfoData.coverImage?.id && albumInfoData.coverImage.id > 0) {
        thumbnailId = albumInfoData.coverImage.id
      }
      
      // 기존 섹션 데이터는 그대로 유지하고 앨범 정보만 업데이트
      const validSections = editingState.sections.map(section => {
        // 서버에 존재하는 섹션인지 확인 (timelineAlbum.sections에 해당 ID가 있는지)
        const isExistingSection = timelineAlbum?.sections.some(originalSection => originalSection.id === section.id)
        
        return {
          ...(isExistingSection && { id: section.id }), // 서버에 있는 섹션만 ID 포함
          name: section.name || '',
          description: section.description || '',
          startDate: section.startDate || '',
          endDate: section.endDate || '',
          photoIds: section.photos
            .filter(photo => photo !== null)
            .map(photo => photo!.id)
        }
      })
      
      // 서버 업데이트 (편집 모드는 유지)
      const updateData = {
        name: albumInfoData.name,
        description: albumInfoData.description || '',
        thumbnailId,
        startDate: albumInfoData.startDate || '',
        endDate: albumInfoData.endDate || '',
        sections: validSections
      }
      
      await updateTimelineAlbumAsync(updateData)
      
      // 편집 모드는 유지하고 데이터만 다시 fetch
      await refetchTimeline()
      
    } catch (error) {
      console.error('앨범 정보 저장 실패:', error)
      throw error
    }
  }, [editingState, timelineAlbum, updateTimelineAlbumAsync, refetchTimeline])

  // 편집 상태를 세션에 저장 (갤러리 이동 전)
  const saveEditingStateToSession = useCallback(() => {
    if (editingState) {
      const stateToSave: SavedEditingState = {
        albumInfo: editingState.albumInfo,
        sections: editingState.sections,
        availablePhotos: availablePhotos
      }
      saveEditingState('timeline', stateToSave)
      console.log('💾 편집 상태가 세션에 저장됨')
    }
  }, [editingState, availablePhotos])

  // 저장
  const save = useCallback(async () => {
    if (!editingState || !timelineAlbum) {
      console.warn('❌ 저장 실패: 편집 상태 또는 앨범 데이터가 없습니다.')
      return
    }

    try {
      // 대표이미지 ID 처리 (변경하지 않으면 null로 전송)
      let thumbnailId = null
      if (editingState.albumInfo.coverImage && editingState.albumInfo.coverImage.id > 0) {
        thumbnailId = editingState.albumInfo.coverImage.id
      } else if (editingState.albumInfo.thumbnailId > 0) {
        thumbnailId = editingState.albumInfo.thumbnailId
      }
      
      console.log('💾 대표이미지 저장:', {
        coverImage: editingState.albumInfo.coverImage,
        thumbnailId: editingState.albumInfo.thumbnailId,
        finalThumbnailId: thumbnailId
      })
      
      // 섹션 데이터 준비
      const validSections = editingState.sections.map((section) => {
        const isExistingSection = timelineAlbum?.sections.some(originalSection => originalSection.id === section.id)
        const photoIds = syncPhotoIds(section.photos)
        
        return {
          ...(isExistingSection && { id: section.id }),
          name: section.name || '',
          description: section.description || '',
          startDate: section.startDate || '',
          endDate: section.endDate || '',
          photoIds
        }
      })

      // 업데이트할 데이터
      const updateData = {
        name: editingState.albumInfo.name || '',
        description: editingState.albumInfo.description || '',
        thumbnailId,
        startDate: editingState.albumInfo.startDate || '',
        endDate: editingState.albumInfo.endDate || '',
        sections: validSections
      }
      
      // 필수 필드 검증
      if (!updateData.name.trim()) {
        throw new Error('앨범 제목을 입력해주세요')
      }

      // 서버 업데이트 실행
      await updateTimelineAlbumAsync(updateData)
      
      // 편집 모드 종료
      setIsEditMode(false)
      setEditingState(null)
      
    } catch (error) {
      console.error('앨범 저장 실패:', error)
      throw error
    }
  }, [editingState, timelineAlbum, updateTimelineAlbumAsync, syncPhotoIds])

  // 표시용 데이터 (편집 중이면 편집 상태, 아니면 서버 데이터)
  const displayData = isEditMode && editingState ? editingState : 
    timelineAlbum ? convertToEditingState(timelineAlbum) : null

  return {
    // 상태
    isEditMode,
    editingState,
    displayData,
    loading,
    isUpdating,
    
    // 표시용 데이터
    albumInfo: displayData?.albumInfo || null,
    sections: displayData?.sections || [],
    availablePhotos: isEditMode ? availablePhotos : [],
    
    // 액션
    startEditing,
    cancelEditing,
    save,
    saveAlbumInfoOnly,
    saveAlbumInfoWithData,
    saveEditingStateToSession,
    refetchTimeline,
    
    // 편집 액션들
    moveSidebarToSection,
    moveSectionToSidebar,
    moveWithinOrBetweenSections,
    setCoverImage,
    updateSection,
    addSection,
    deleteSection,
    updateAlbumInfo,
    removePhotosFromState
  }
}