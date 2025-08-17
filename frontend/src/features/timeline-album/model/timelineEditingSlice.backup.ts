import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Photo } from '@/entities/photo'
import { TimelineSection } from '@/entities/album'

// 앨범 정보 인터페이스
interface AlbumInfo {
  name: string
  description: string
  startDate: string
  endDate: string
  thumbnailId: number
  coverImage: Photo | null
}

// 타임라인 편집 상태
interface TimelineEditingState {
  editedSections: TimelineSection[]
  editedAlbumInfo: AlbumInfo
  unusedPhotos: Photo[] // 서버에서 받은 미사용 사진들
  isEditMode: boolean
}

const initialState: TimelineEditingState = {
  editedSections: [],
  editedAlbumInfo: {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    thumbnailId: 0,
    coverImage: null
  },
  unusedPhotos: [],
  isEditMode: false
}

const timelineEditingSlice = createSlice({
  name: 'timelineEditing',
  initialState,
  reducers: {
    // 편집 모드 설정
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.isEditMode = action.payload
    },

    // 초기 데이터 설정 (서버에서 받은 데이터)
    initializeTimelineData: (state, action: PayloadAction<{
      sections: TimelineSection[]
      albumInfo: AlbumInfo
      unusedPhotos: Photo[]
    }>) => {
      state.editedSections = action.payload.sections
      state.editedAlbumInfo = action.payload.albumInfo
      state.unusedPhotos = action.payload.unusedPhotos
    },

    // 섹션 업데이트
    updateSection: (state, action: PayloadAction<{
      sectionId: number
      field: string
      value: string
    }>) => {
      const { sectionId, field, value } = action.payload
      const section = state.editedSections.find(s => s.id === sectionId)
      if (section) {
        ;(section as any)[field] = value
      }
    },

    // 새 섹션 추가
    addSection: (state) => {
      const newSection: TimelineSection = {
        id: Date.now(),
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        photoIds: [],
        photos: Array(3).fill(null)
      }
      state.editedSections.push(newSection)
    },

    // 섹션 삭제
    deleteSection: (state, action: PayloadAction<number>) => {
      const sectionId = action.payload
      state.editedSections = state.editedSections.filter(s => s.id !== sectionId)
    },

    // 갤러리에서 섹션으로 사진 이동
    moveSidebarToSection: (state, action: PayloadAction<{
      photoId: number
      sectionIndex: number
      imageIndex: number
    }>) => {
      const { photoId, sectionIndex, imageIndex } = action.payload
      console.log('📤 갤러리 → 섹션 이동:', { photoId, sectionIndex, imageIndex })

      // 미사용 사진에서 해당 사진 찾기
      const photo = state.unusedPhotos.find(p => p.id === photoId)
      if (!photo) {
        console.warn('❌ 사진을 찾을 수 없음:', photoId)
        return
      }

      // 섹션에 사진 배치
      const section = state.editedSections[sectionIndex]
      if (section) {
        if (!section.photos) section.photos = Array(3).fill(null)
        if (!section.photoIds) section.photoIds = Array(3).fill(0)

        section.photos[imageIndex] = photo
        section.photoIds[imageIndex] = photoId
      }
    },

    // 섹션에서 갤러리로 사진 이동 (제거)
    moveSectionToSidebar: (state, action: PayloadAction<{
      sectionId: number
      imageIndex: number
    }>) => {
      const { sectionId, imageIndex } = action.payload
      console.log('📥 섹션 → 갤러리 이동:', { sectionId, imageIndex })

      // 해당 섹션 찾기
      const section = state.editedSections.find(s => s.id === sectionId)
      if (section && section.photos && section.photoIds) {
        // 해당 인덱스 사진 제거
        section.photos[imageIndex] = null
        section.photoIds[imageIndex] = 0
      }
    },

    // 섹션 내부에서 사진 위치 변경
    moveSectionToSection: (state, action: PayloadAction<{
      fromSectionIndex: number
      fromImageIndex: number
      toSectionIndex: number
      toImageIndex: number
    }>) => {
      const { fromSectionIndex, fromImageIndex, toSectionIndex, toImageIndex } = action.payload
      
      const fromSection = state.editedSections[fromSectionIndex]
      const toSection = state.editedSections[toSectionIndex]
      
      if (fromSection?.photos && toSection?.photos) {
        const movingPhoto = fromSection.photos[fromImageIndex]
        const movingPhotoId = fromSection.photoIds?.[fromImageIndex] || 0
        
        // 기존 위치에서 제거
        fromSection.photos[fromImageIndex] = null
        if (fromSection.photoIds) fromSection.photoIds[fromImageIndex] = 0
        
        // 새 위치에 배치
        toSection.photos[toImageIndex] = movingPhoto
        if (!toSection.photoIds) toSection.photoIds = Array(3).fill(0)
        toSection.photoIds[toImageIndex] = movingPhotoId
      }
    },

    // 대표이미지 설정
    setCoverImage: (state, action: PayloadAction<{
      photoId: number
      photo: Photo
    }>) => {
      const { photoId, photo } = action.payload
      state.editedAlbumInfo.coverImage = photo
      state.editedAlbumInfo.thumbnailId = photoId
    },

    // 앨범 정보 업데이트
    updateAlbumInfo: (state, action: PayloadAction<Partial<AlbumInfo>>) => {
      state.editedAlbumInfo = { ...state.editedAlbumInfo, ...action.payload }
    },

    // 편집 상태 초기화
    resetEditingState: (state) => {
      return initialState
    }
  }
})

export const {
  setEditMode,
  initializeTimelineData,
  updateSection,
  addSection,
  deleteSection,
  moveSidebarToSection,
  moveSectionToSidebar,
  moveSectionToSection,
  setCoverImage,
  updateAlbumInfo,
  resetEditingState
} = timelineEditingSlice.actions

export default timelineEditingSlice.reducer

// Selectors
export const selectTimelineEditing = (state: { timelineEditing: TimelineEditingState }) => state.timelineEditing

// 사용 가능한 사진들 계산 (사이드바에 표시될 사진들)
export const selectAvailablePhotos = (state: { timelineEditing: TimelineEditingState }) => {
  const { unusedPhotos, editedSections, editedAlbumInfo } = state.timelineEditing
  
  // 현재 사용 중인 사진 ID들 수집
  const usedPhotoIds = new Set<number>()
  
  // 섹션에서 사용된 사진들
  editedSections.forEach(section => {
    if (section.photos) {
      section.photos.forEach(photo => {
        if (photo?.id) usedPhotoIds.add(photo.id)
      })
    }
  })
  
  // 대표이미지로 사용된 사진
  if (editedAlbumInfo.coverImage?.id) {
    usedPhotoIds.add(editedAlbumInfo.coverImage.id)
  }
  
  // 사용되지 않은 사진들만 반환
  return unusedPhotos.filter(photo => !usedPhotoIds.has(photo.id))
}