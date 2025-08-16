"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Edit, Plus, Trash2, Settings, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTimelineEditor, EditingSection } from "../model/useTimelineEditor"
import { useTimelineAlbum } from "../model/useTimelineAlbum"
import { AlbumInfoEditModal } from "@/shared/ui/modal/AlbumInfoEditModal"
import { PhotoDropZone } from "@/features/photo-drag-drop"
import type { RootState } from "@/shared/config/store"
import type { DragPhotoData } from "@/entities/photo"
import { Photo } from "@/entities/photo"
import { clearSelectedPhotos, setIsFromGallery } from "@/features/photo-gallery/model/photoSelectionSlice"
import { addPhotosToTimelineAlbum, removePhotosFromTimelineAlbum } from "../api/timelineAlbumPhotos"
import { saveEditingState, clearEditingState, TimelineEditingState } from "@/shared/lib/editingStateManager"

interface TimelineAlbumPageProps {
  groupId: string
  albumId: string
}

// 섹션별 이미지 레이아웃 컴포넌트
function TimelineSectionLayout({ 
  section, 
  index, 
  isEditMode = false,
  onImageDrop,
  dragOverImageIndex,
  onImageDragOver,
  onImageDragLeave,
  onSectionUpdate,
  onSectionDelete,
  preventPhotoDragDrop
}: { 
  section: EditingSection
  index: number
  isEditMode?: boolean
  onImageDrop?: (imageIndex: number, dragData: DragPhotoData) => void
  dragOverImageIndex?: number | null
  onImageDragOver?: (imageIndex: number) => void
  onImageDragLeave?: () => void
  onSectionUpdate?: (sectionIndex: number, field: string, value: string) => void
  onSectionDelete?: (sectionIndex: number) => void
  preventPhotoDragDrop?: any
}) {
  // 섹션의 사진들 (최대 3개, 인덱스 보존)
  const photos = section.photos || []
  
  const imageSlots: (Photo | null)[] = [...photos]
  while (imageSlots.length < 3) {
    imageSlots.push(null)
  }

  const layoutProps = {
    0: { // Section 1: 큰 이미지 왼쪽 상단, 작은 이미지들 오른쪽 하단 겹침
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[15%] right-[5%] w-[35%] h-[35%] transform rotate-[3deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-5deg] z-15 overflow-hidden",
    },
    1: { // Section 2: 큰 이미지 오른쪽, 작은 이미지들 왼쪽 하단
      mainClass: "absolute top-0 right-0 w-[65%] h-[70%] transform rotate-[1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[10%] left-[5%] w-[35%] h-[35%] transform rotate-[-4deg] z-20 overflow-hidden", 
      small2Class: "absolute bottom-[25%] left-[25%] w-[30%] h-[30%] transform rotate-[6deg] z-15 overflow-hidden",
    },
    2: { // Section 3: 큰 이미지 왼쪽, 작은 이미지들 오른쪽
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[20%] right-[5%] w-[35%] h-[35%] transform rotate-[4deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-3deg] z-15 overflow-hidden",
    },
    3: { // Section 4: 큰 이미지 중앙-오른쪽, 작은 이미지들 하단
      mainClass: "absolute top-0 left-1/2 transform -translate-x-1/2 w-[60%] h-[65%] rotate-[2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[5%] left-[10%] w-[35%] h-[35%] transform rotate-[-2deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[10%] w-[35%] h-[35%] transform rotate-[5deg] z-15 overflow-hidden",
    }
  }

  const layout = layoutProps[index % 4 as keyof typeof layoutProps]
  const imageClasses = [layout.mainClass, layout.small1Class, layout.small2Class]

  const createImageDropZone = (imageIndex: number, className: string, photo: Photo | null) => {
    const ImageWrapper = isEditMode ? PhotoDropZone : motion.div
    
    const baseProps = {
      className: `${className} ${
        isEditMode && dragOverImageIndex === imageIndex ? 'ring-2 ring-[#FE7A25]' : ''
      } bg-[#222222]/50 rounded-sm border border-white/10 ${
        photo && isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isEditMode ? 'hover:ring-1 hover:ring-[#FE7A25]/50 transition-all duration-200' : ''
      }`
    }

    const dropZoneProps = {
      onDrop: (dragData: DragPhotoData, e: React.DragEvent) => onImageDrop?.(imageIndex, dragData),
      onDragOver: () => onImageDragOver?.(imageIndex),
      onDragLeave: onImageDragLeave,
      isDragOver: dragOverImageIndex === imageIndex,
      dropZoneId: `section-${section.id}-image-${imageIndex}`
    }

    const motionProps = {
      initial: { opacity: 0, scale: 0.9, rotate: index % 2 === 0 ? -2 : 2 },
      whileInView: { opacity: 1, scale: 1, rotate: index % 2 === 0 ? -2 : 2 },
      transition: { duration: 0.6, delay: 0.3 + imageIndex * 0.2 },
      viewport: { once: true }
    }

    
    const imageContent = (
      <>
        {photo ? (
          <Image
            src={photo.originalUrl || "/placeholder/photo-placeholder.svg"}
            alt={`${section.name} ${imageIndex === 0 ? 'main' : `detail ${imageIndex}`}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white/40 text-center text-sm font-keepick-primary">
              {isEditMode ? '사진을 드래그하세요' : '사진 없음'}
            </div>
          </div>
        )}
        {isEditMode && (
          <>
            {/* 드롭 오버레이 - 더 큰 드롭 영역 제공 */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="text-white text-center text-sm font-keepick-primary">
                사진 {imageIndex + 1}
              </div>
            </div>
            {/* 확장된 드롭 영역 - 패딩으로 더 넓은 드롭 영역 */}
            <div className="absolute -inset-2 pointer-events-none" />
          </>
        )}
      </>
    )

    if (isEditMode) {
      return (
        <PhotoDropZone 
          key={`section-${section.id}-image-${imageIndex}`} 
          {...baseProps} 
          {...dropZoneProps}
          // 섹션의 사진을 드래그 가능하게 만들기
          draggable={!!photo}
          onDragStart={(e) => {
            if (photo) {
              const dragData: DragPhotoData = {
                photoId: photo.id,
                source: `section-${index}-${imageIndex}`, // index는 렌더링 순서
                originalUrl: photo.originalUrl,
                thumbnailUrl: photo.thumbnailUrl,
                name: photo.name
              }
              e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
              e.dataTransfer.effectAllowed = 'copy' // 대표이미지는 복사 개념
            }
          }}
        >
          {imageContent}
        </PhotoDropZone>
      )
    }
    
    return (
      <motion.div 
        key={`section-${section.id}-image-${imageIndex}`} 
        {...baseProps} 
        {...motionProps}
      >
        {imageContent}
      </motion.div>
    )
  }

  return (
    <motion.section
      key={section.id}
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
      className="min-h-screen flex items-center justify-center px-8 py-16 bg-[#111111] relative"
    >
      {/* 섹션 삭제 버튼 */}
      {isEditMode && onSectionDelete && (
        <button
          onClick={() => onSectionDelete(index)} // sectionIndex 전달
          className="absolute top-8 right-8 z-50 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors duration-200"
          title="섹션 삭제"
        >
          <Trash2 size={16} className="text-white" />
        </button>
      )}

      <div className="max-w-7xl w-full">
        <div className={`grid grid-cols-12 gap-8 items-center ${index % 2 === 0 ? "" : "lg:grid-flow-col-dense"}`}>
          {/* Text Content */}
          <div className={`col-span-12 lg:col-span-5 space-y-6 ${
            index % 2 === 0 ? "lg:pr-12" : "lg:pl-12 lg:col-start-8"
          }`}>
            {/* 날짜 범위 */}
            {isEditMode ? (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={section.startDate || ''}
                  onChange={(e) => onSectionUpdate?.(index, 'startDate', e.target.value)}
                  className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider bg-transparent border border-[#FE7A25]/30 rounded px-2 py-1 focus:border-[#FE7A25] focus:outline-none [color-scheme:dark]"
                  {...preventPhotoDragDrop}
                />
                <span className="text-[#FE7A25] font-keepick-primary text-sm">~</span>
                <input
                  type="date"
                  value={section.endDate || ''}
                  onChange={(e) => onSectionUpdate?.(index, 'endDate', e.target.value)}
                  className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider bg-transparent border border-[#FE7A25]/30 rounded px-2 py-1 focus:border-[#FE7A25] focus:outline-none [color-scheme:dark]"
                  {...preventPhotoDragDrop}
                />
              </div>
            ) : (
              <div className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider">
                {section.startDate && section.endDate ? 
                  `${section.startDate} ~ ${section.endDate}` : 
                  "날짜를 입력하세요"
                }
              </div>
            )}

            {/* 섹션 제목 */}
            {isEditMode ? (
              <textarea
                value={section.name}
                onChange={(e) => onSectionUpdate?.(index, 'name', e.target.value)}
                className="font-keepick-heavy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide bg-transparent border border-white/30 rounded px-3 py-2 focus:border-white focus:outline-none text-white resize-none overflow-hidden w-full"
                placeholder="섹션 제목을 입력하세요"
                rows={Math.max(2, section.name.split('\n').length)}
                style={{ height: 'auto', minHeight: '120px' }}
                {...preventPhotoDragDrop}
              />
            ) : (
              <h2 className="font-keepick-heavy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide">
                {section.name ? 
                  section.name.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  )) : 
                  <div className="text-gray-500">섹션 제목을 입력하세요</div>
                }
              </h2>
            )}

            {/* 섹션 설명 */}
            {isEditMode ? (
              <textarea
                value={section.description}
                onChange={(e) => onSectionUpdate?.(index, 'description', e.target.value)}
                className="font-keepick-primary text-gray-300 leading-relaxed text-base md:text-lg bg-transparent border border-gray-500/30 rounded px-3 py-2 focus:border-gray-400 focus:outline-none resize-none overflow-hidden"
                placeholder="섹션 설명을 입력하세요"
                rows={Math.max(3, Math.ceil(section.description.length / 40) + section.description.split('\n').length)}
                style={{ width: '100%', maxWidth: '28rem', height: 'auto', minHeight: '80px' }}
                {...preventPhotoDragDrop}
              />
            ) : (
              <p className="font-keepick-primary leading-relaxed text-base md:text-lg max-w-md">
                {section.description ? 
                  <span className="text-gray-300">{section.description}</span> : 
                  <span className="text-gray-500">섹션 설명을 입력하세요</span>
                }
              </p>
            )}
          </div>

          {/* Images Collage */}
          <div className={`col-span-12 lg:col-span-7 relative h-[500px] md:h-[600px] ${
            index % 2 === 0 ? "" : "lg:col-start-1"
          }`}>
            {/* Main large image */}
            {createImageDropZone(0, layout.mainClass, imageSlots[0])}

            {/* Small image 1 */}
            {createImageDropZone(1, layout.small1Class, imageSlots[1])}

            {/* Small image 2 */}
            {createImageDropZone(2, layout.small2Class, imageSlots[2])}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default function TimelineAlbumPage({ groupId, albumId }: TimelineAlbumPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { selectedPhotos, isFromGallery } = useSelector((state: RootState) => state.photoSelection)
  
  // 기본 앨범 정보 (편집 모드와 관계없이 항상 로드)
  const { timelineAlbum: baseAlbum, loading: baseLoading } = useTimelineAlbum(groupId, albumId)
  
  // 새로운 통합된 에디터 훅 사용 (복잡한 useEffect 체인 모두 제거!)
  const {
    isEditMode,
    loading,
    isUpdating,
    albumInfo,
    sections,
    availablePhotos,
    startEditing,
    cancelEditing,
    save,
    moveSidebarToSection,
    moveSectionToSidebar,
    moveWithinOrBetweenSections,
    setCoverImage,
    updateSection,
    addSection,
    deleteSection,
    updateAlbumInfo,
    refetchTimeline,
    removePhotosFromState,
    saveAlbumInfoOnly,
    saveAlbumInfoWithData,
    saveEditingStateToSession
  } = useTimelineEditor(groupId, albumId)

  const [dragOverImage, setDragOverImage] = useState<{ sectionIndex: number; imageIndex: number } | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isAlbumInfoModalOpen, setIsAlbumInfoModalOpen] = useState(false)
  
  // 모달용 로컬 상태 (모달 내부에서만 수정, 저장 시에만 실제 상태 업데이트)
  const [modalAlbumInfo, setModalAlbumInfo] = useState<any>(null)

  // 사이드바에서 섹션으로 드롭된 사진 처리 (window 이벤트로 통신)
  const handleSidebarDrop = useCallback((dragData: DragPhotoData) => {
    // 섹션에서 드래그된 사진인 경우 사이드바로 이동
    if (dragData.source && dragData.source.startsWith('section-')) {
      const sourceMatch = dragData.source.match(/section-(\d+)-(\d+)/)
      if (sourceMatch) {
        const sectionIndex = parseInt(sourceMatch[1])
        const imageIndex = parseInt(sourceMatch[2])
        moveSectionToSidebar(sectionIndex, imageIndex)
      }
    }
  }, [moveSectionToSidebar])

  // 사이드바 드롭 이벤트 리스너 등록
  useEffect(() => {
    const handleSidebarDropEvent = (event: CustomEvent) => {
      handleSidebarDrop(event.detail)
    }

    window.addEventListener('timelineSidebarDrop', handleSidebarDropEvent as EventListener)
    
    return () => {
      window.removeEventListener('timelineSidebarDrop', handleSidebarDropEvent as EventListener)
    }
  }, [handleSidebarDrop])

  // 사이드바로 실시간 데이터 전송 (안전한 이벤트 발송)
  useEffect(() => {
    if (isEditMode && availablePhotos.length >= 0) { // 빈 배열도 유효한 상태로 간주
      // 약간의 지연을 두어 사이드바 컴포넌트가 마운트된 후 이벤트 발송
      const timeoutId = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('timelineAvailablePhotosUpdate', { 
          detail: availablePhotos 
        }))
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [availablePhotos, isEditMode])

  // 편집 모드 변경 시 즉시 사이드바에 알림 (추가 안전장치)
  useEffect(() => {
    if (isEditMode) {
      // 편집 모드 진입 시 사이드바가 데이터를 요청할 수 있도록 이벤트 발송
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('timelineEditModeChanged', { 
          detail: { isEditMode: true, availablePhotos } 
        }))
      }, 200)
    }
  }, [isEditMode, availablePhotos])

  // 사이드바 마운트 이벤트 처리 (사이드바가 늦게 마운트되는 경우 대응)
  useEffect(() => {
    const handleSidebarMounted = () => {
      if (isEditMode && availablePhotos.length >= 0) {
        window.dispatchEvent(new CustomEvent('timelineAvailablePhotosUpdate', { 
          detail: availablePhotos 
        }))
      }
    }

    window.addEventListener('timelineSidebarMounted', handleSidebarMounted)
    
    return () => {
      window.removeEventListener('timelineSidebarMounted', handleSidebarMounted)
    }
  }, [isEditMode, availablePhotos])
  
  // 사이드바에서 사진 삭제 이벤트 처리
  useEffect(() => {
    const handlePhotosDeleted = (event: CustomEvent) => {
      const deletedPhotoIds: number[] = event.detail
      
      // 편집 상태에서 삭제된 사진들 제거
      removePhotosFromState(deletedPhotoIds)
    }

    window.addEventListener('timelinePhotosDeleted', handlePhotosDeleted as EventListener)
    
    return () => {
      window.removeEventListener('timelinePhotosDeleted', handlePhotosDeleted as EventListener)
    }
  }, [removePhotosFromState])

  // 갤러리로 이동 전 편집 상태 저장 이벤트 처리
  useEffect(() => {
    const handleSaveEditingState = () => {
      if (isEditMode) {
        saveEditingStateToSession()
      }
    }

    window.addEventListener('saveTimelineEditingState', handleSaveEditingState)
    
    return () => {
      window.removeEventListener('saveTimelineEditingState', handleSaveEditingState)
    }
  }, [isEditMode, saveEditingStateToSession])

  // 갤러리에서 돌아온 경우 데이터 새로고침 후 편집모드 진입
  useEffect(() => {
    const fromGallery = searchParams.get('from') === 'gallery'
    if (fromGallery) {
      console.log('갤러리에서 돌아옴 - 저장된 편집 상태 삭제 후 최신 데이터로 편집모드 진입')
      
      // 갤러리에서 돌아온 경우 저장된 편집 상태 삭제 (새 사진이 포함된 최신 데이터 사용하기 위해)
      clearEditingState('timeline')
      
      // 먼저 최신 데이터 새로고침
      refetchTimeline().then(() => {
        console.log('갤러리 추가 사진 포함한 데이터 새로고침 완료 - 편집모드 진입')
        // 데이터 새로고침 완료 후 편집모드 진입
        startEditing()
      }).catch((error) => {
        console.error('데이터 새로고침 실패:', error)
        // 실패해도 편집모드는 진입
        startEditing()
      })
      
      // URL에서 from=gallery 파라미터만 제거하고 edit=true는 유지
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('from') // from=gallery만 제거
      const newUrl = `/group/${groupId}/timeline/${albumId}?${newSearchParams.toString()}`
      router.replace(newUrl)
    }
  }, [searchParams, router, groupId, albumId, startEditing, refetchTimeline])

  // 빈 앨범 자동 편집 모드 진입 (단순화됨)
  useEffect(() => {
    if (albumInfo && !albumInfo.name?.trim() && !isEditMode) {
      // 내부 상태 업데이트
      startEditing()
      
      // URL에 edit=true 파라미터 추가
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('edit', 'true')
      router.replace(`/group/${groupId}/timeline/${albumId}?${newSearchParams.toString()}`)
      
      setTimeout(() => titleInputRef.current?.focus(), 500)
    }
  }, [albumInfo?.name, isEditMode, startEditing, searchParams, router, groupId, albumId])

  const handleEditModeToggle = () => {
    if (isEditMode) {
      handleSave()
    } else {
      // 편집 모드 시작: 내부 상태 + URL 업데이트
      startEditing()
      
      // URL에 edit=true 파라미터 추가
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('edit', 'true')
      router.replace(`/group/${groupId}/timeline/${albumId}?${newSearchParams.toString()}`)
    }
  }

  const handleSave = async () => {
    try {
      await save()
      
      // URL에서 edit=true 파라미터 제거 (편집 모드 종료)
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('edit')
      const newUrl = newSearchParams.toString() 
        ? `/group/${groupId}/timeline/${albumId}?${newSearchParams.toString()}`
        : `/group/${groupId}/timeline/${albumId}`
      router.replace(newUrl)
      
      // 저장 완료 후 갤러리 상태 정리
      if (isFromGallery) {
        dispatch(clearSelectedPhotos())
        dispatch(setIsFromGallery(false))
      }
    } catch (error: any) {
      // 제목 미입력 에러 처리 - 앨범 정보 모달 띄우기
      if (error.message === '앨범 제목을 입력해주세요') {
        // 모달 열 때 현재 앨범 정보를 로컬 상태로 복사
        if (albumInfo) {
          setModalAlbumInfo({
            name: albumInfo.name || '',
            description: albumInfo.description || '',
            startDate: albumInfo.startDate || '',
            endDate: albumInfo.endDate || ''
          })
        }
        setIsAlbumInfoModalOpen(true)
        return // alert 표시하지 않고 모달만 띄움
      }
      
      alert(error.message || '앨범 저장에 실패했습니다.')
    }
  }

  const handleSectionUpdate = (sectionIndex: number, field: string, value: string) => {
    updateSection(sectionIndex, field, value)
  }

  const handleAddSection = () => {
    addSection()
  }

  const handleDeleteSection = (sectionIndex: number) => {
    deleteSection(sectionIndex)
  }

  const handleImageDrop = (sectionIndex: number, imageIndex: number, dragData: DragPhotoData) => {
    // 갤러리에서 섹션으로 이동
    if (dragData.source === 'gallery') {
      moveSidebarToSection(dragData.photoId, sectionIndex, imageIndex)
    }
    // 섹션 내/섹션 간 이동
    else if (dragData.source.startsWith('section-')) {
      const sourceMatch = dragData.source.match(/section-(\d+)-(\d+)/)
      if (sourceMatch) {
        const fromSectionIndex = parseInt(sourceMatch[1])
        const fromImageIndex = parseInt(sourceMatch[2])
        moveWithinOrBetweenSections(fromSectionIndex, fromImageIndex, sectionIndex, imageIndex)
      }
    }
    
    setDragOverImage(null)
  }

  const handleImageDragOver = (sectionIndex: number, imageIndex: number) => {
    setDragOverImage({ sectionIndex, imageIndex })
  }

  const handleImageDragLeave = () => {
    setDragOverImage(null)
  }

  // 섹션에서 사진 제거 핸들러
  const handleSectionPhotoRemove = (dragData: DragPhotoData) => {
    // source에서 섹션 정보 파싱 (section-{sectionIndex}-{imageIndex})
    const sourceMatch = dragData.source.match(/section-(\d+)-(\d+)/)
    if (!sourceMatch) return
    
    const renderIndex = parseInt(sourceMatch[1])
    const imageIndex = parseInt(sourceMatch[2])
    
    if (renderIndex >= 0 && renderIndex < sections.length) {
      moveSectionToSidebar(renderIndex, imageIndex)
    }
  }

  // 텍스트 입력 필드에 사진 드래그 방지 핸들러
  const preventPhotoDragDrop = {
    onDragOver: (e: React.DragEvent) => {
      // 사진 드래그 데이터가 있는지 확인
      const dragData = e.dataTransfer.types.includes('text/plain')
      if (dragData) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'none' as any
        (e.currentTarget as HTMLElement).style.cursor = 'not-allowed'
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.cursor = 'auto'
    },
    onDrop: (e: React.DragEvent) => {
      // 사진 드래그 데이터인지 확인하고 차단
      try {
        const data = e.dataTransfer.getData('text/plain')
        const dragData = JSON.parse(data)
        if (dragData.photoId) {
          e.preventDefault()
          e.stopPropagation()
        }
      } catch {
        // JSON 파싱 실패 시 일반 텍스트로 간주하고 허용
      }
      (e.currentTarget as HTMLElement).style.cursor = 'auto'
    }
  }

  // 대표이미지에서 사진 제거 핸들러
  const handleCoverImageRemove = (dragData: DragPhotoData) => {
    if (dragData.source === 'cover-image') {
      updateAlbumInfo({ coverImage: null, thumbnailId: 0 })
    }
  }

  const handleCoverImageSelect = (photo: Photo) => {
    setCoverImage(photo.id, photo)
  }

  // 편집 취소 공통 함수
  const handleCancelEditing = () => {
    cancelEditing()
    
    // URL에서 edit=true 파라미터 제거 (편집 모드 종료)
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.delete('edit')
    const newUrl = newSearchParams.toString() 
      ? `/group/${groupId}/timeline/${albumId}?${newSearchParams.toString()}`
      : `/group/${groupId}/timeline/${albumId}`
    router.replace(newUrl)
    
    // 편집 취소 시 갤러리 상태 정리
    if (isFromGallery) {
      dispatch(clearSelectedPhotos())
      dispatch(setIsFromGallery(false))
    }
  }

  if (baseLoading && !baseAlbum) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">타임라인을 불러오는 중...</div>
          <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!baseAlbum && !baseLoading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">타임라인 앨범을 찾을 수 없습니다</div>
          <Link href={`/group/${groupId}?album=timeline`} className="text-[#FE7A25] hover:underline">
            그룹 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <header className="fixed top-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800 transition-all duration-200"
               style={{ left: '240px', width: 'calc(100% - 240px)' }}>
        <div className="relative flex items-center py-2 px-8">
          {/* 왼쪽 영역 - 고정 너비 */}
          <div className="flex items-center" style={{ width: '200px' }}>
            <Link href={`/group/${groupId}?album=timeline`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <ArrowLeft size={20} />
              <span className="font-keepick-primary text-sm">돌아가기</span>
            </Link>
          </div>
          
          {/* 중앙 제목 - 절대 위치로 중앙 고정 */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="font-keepick-heavy text-xl tracking-wider text-center">
              {(isEditMode ? albumInfo?.name : baseAlbum?.name) || '제목 없음'}
            </h1>
          </div>
          
          {/* 오른쪽 영역 - 버튼들 */}
          <div className="flex gap-2 ml-auto">
            {/* 취소 버튼 */}
            {isEditMode && (
              <button
                onClick={handleCancelEditing}
                className="group relative px-4 py-2 text-white hover:text-red-400 transition-all duration-300"
                title="편집 취소"
              >
                <div className="flex items-center gap-2">
                  <X size={16} />
                  <span className="font-keepick-primary text-sm tracking-wide">취소</span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-300"></div>
              </button>
            )}
            
            {/* 섹션 추가 버튼 */}
            {isEditMode && (
              <button
                onClick={handleAddSection}
                className="group relative px-4 py-2 text-white hover:text-green-400 transition-all duration-300"
                title="섹션 추가"
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  <span className="font-keepick-primary text-sm tracking-wide">섹션 추가</span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300"></div>
              </button>
            )}
            
            {/* 앨범 정보 수정 버튼 - 편집 모드일 때만 표시 */}
            {isEditMode && (
              <button
                onClick={() => {
                  // 모달 열 때 현재 앨범 정보를 로컬 상태로 복사
                  if (albumInfo) {
                    setModalAlbumInfo({
                      name: albumInfo.name || '',
                      description: albumInfo.description || '',
                      startDate: albumInfo.startDate || '',
                      endDate: albumInfo.endDate || ''
                    })
                  }
                  setIsAlbumInfoModalOpen(true)
                }}
                className="group relative px-4 py-2 text-white hover:text-blue-400 transition-all duration-300"
                title="앨범 정보 수정"
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} />
                  <span className="font-keepick-primary text-sm tracking-wide">앨범 정보</span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></div>
              </button>
            )}
            
            {/* 편집/완료 버튼 */}
            <button
              onClick={handleEditModeToggle}
              disabled={isUpdating}
              className={`group relative px-4 py-2 text-white transition-all duration-300 ${
                isEditMode
                  ? 'hover:text-green-400'
                  : 'hover:text-[#FE7A25]'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isEditMode ? '편집 완료' : '앨범 편집'}
            >
              <div className="flex items-center gap-2">
                <Edit size={16} />
                <span className="font-keepick-primary text-sm tracking-wide">
                  {isUpdating ? '저장 중...' : isEditMode ? '완료' : '수정'}
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                isEditMode ? 'bg-green-400' : 'bg-[#FE7A25]'
              }`}></div>
            </button>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="pt-16 bg-[#111111] relative">
        
        {/* 대표이미지 드롭존 - 편집 모드에서만 표시 (헤더 중앙 아래로 이동) */}
        {isEditMode && (
          <div className="absolute top-4 sm:top-6 md:top-8 left-1/2 transform -translate-x-1/2 z-10">
            <PhotoDropZone
              onDrop={(dragData) => {
                const photo: Photo = {
                  id: dragData.photoId,
                  thumbnailUrl: dragData.thumbnailUrl || '/placeholder/photo-placeholder.svg',
                  originalUrl: dragData.originalUrl || '/placeholder/photo-placeholder.svg',
                  name: dragData.name || `사진 #${dragData.photoId}`
                }
                setCoverImage(dragData.photoId, photo)
              }}
              dropZoneId="cover-image-drop-zone"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-[#FE7A25]/20 hover:border-[#FE7A25]/70 transition-all duration-300 bg-[#111111]/95 backdrop-blur-sm shadow-lg"
            >
              {albumInfo?.coverImage ? (
                <div className="relative w-32 h-32" style={{ overflow: 'visible' }}>
                  <div className="w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={albumInfo.coverImage.thumbnailUrl || albumInfo.coverImage.originalUrl}
                      alt="대표이미지"
                      fill
                      sizes="128px"
                      className="object-cover"
                      draggable={false}
                    />
                  </div>
                  {/* 제거 버튼 */}
                  <button
                    onClick={() => updateAlbumInfo({ coverImage: null, thumbnailId: 0 })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg border-2 border-white z-20"
                    title="대표이미지 제거"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-[#FE7A25]/30 flex flex-col items-center justify-center bg-[#111111] hover:bg-[#111111]/80 transition-colors">
                  <span className="text-[#FE7A25]/70 text-sm font-medium text-center px-2">
                    사진을<br />드래그하세요
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-300 text-center font-medium">대표이미지</span>
            </PhotoDropZone>
          </div>
        )}
        
        {/* 섹션들 컨테이너 - 대표이미지와의 간격 확보 */}
        <div className={`${isEditMode ? 'mt-12 sm:mt-14 md:mt-16' : ''}`}>
        {sections.map((section, index) => (
          <TimelineSectionLayout
            key={`section-${section.id}-${index}`}
            section={section}
            index={index}
            isEditMode={isEditMode}
            onImageDrop={(imageIndex, dragData) => handleImageDrop(index, imageIndex, dragData)}
            dragOverImageIndex={dragOverImage?.sectionIndex === index ? dragOverImage.imageIndex : null}
            onImageDragOver={(imageIndex) => handleImageDragOver(index, imageIndex)}
            onImageDragLeave={handleImageDragLeave}
            onSectionUpdate={handleSectionUpdate}
            onSectionDelete={sections.length > 1 ? handleDeleteSection : undefined}
            preventPhotoDragDrop={preventPhotoDragDrop}
          />
        ))}
        </div>
      </main>

        {/* Footer */}
        <footer className="bg-[#111111] border-t border-gray-800 py-16">
        
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-keepick-heavy text-3xl md:text-4xl mb-4 tracking-wider">
            {albumInfo?.name || '제목 없음'}
          </h2>
          <p className="font-keepick-primary text-gray-400 text-sm tracking-wider">
            {albumInfo?.description || ''}
          </p>
          <div className="mt-8 flex justify-center gap-8 text-sm font-keepick-primary text-gray-500">
            <Link href={`/group/${groupId}`} className="hover:text-white transition-colors">
              홈
            </Link>
            <Link href={`/group/${groupId}#gallery`} className="hover:text-white transition-colors">
              갤러리
            </Link>
          </div>
        </div>
      </footer>


      {/* 앨범정보 수정 모달 */}
      <AlbumInfoEditModal
        isOpen={isAlbumInfoModalOpen}
        onClose={() => {
          setIsAlbumInfoModalOpen(false)
          setModalAlbumInfo(null)
        }}
        albumInfo={modalAlbumInfo}
        onAlbumInfoUpdate={(updates) => {
          // 모달 내부에서는 로컬 상태만 업데이트
          setModalAlbumInfo((prev: any) => ({
            ...prev,
            ...updates
          }))
        }}
        showDateInputs={true}
        onSave={async () => {
          // 모달에서 저장 시 최신 모달 데이터로 직접 저장
          if (modalAlbumInfo) {
            // 먼저 편집 상태를 업데이트
            updateAlbumInfo(modalAlbumInfo)
            
            // 모달 데이터로 직접 저장 요청 (React 상태 업데이트 비동기 이슈 해결)
            await saveAlbumInfoWithData(modalAlbumInfo)
            
            // 앨범 정보만 저장하고 편집 모드는 그대로 유지
            // 사용자가 다시 완료 버튼을 눌러야 전체 완료됨
          }
        }}
        title="타임라인 앨범 정보 수정"
        albumType="timeline"
      />

    </div>
  )
}