"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTimelineEditor, EditingSection } from "../model/useTimelineEditor"
import { TimelineEditingSidebar } from "./TimelineEditingSidebar"
import { AlbumInfoModal } from "./AlbumInfoModal"
import { PhotoDropZone } from "@/features/photo-drag-drop"
import type { RootState } from "@/shared/config/store"
import type { DragPhotoData } from "@/entities/photo"
import { Photo } from "@/entities/photo"
import { clearSelectedPhotos, setIsFromGallery } from "@/features/photo-gallery/model/photoSelectionSlice"

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
  onSectionDelete
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
}) {
  // 섹션의 사진들 (최대 3개, 인덱스 보존)
  const photos = section.photos || []
  console.log(`🖼️ 섹션 ${section.id} 사진들:`, photos)
  
  const imageSlots: (Photo | null)[] = [...photos]
  while (imageSlots.length < 3) {
    imageSlots.push(null)
  }
  
  console.log(`🖼️ 섹션 ${section.id} imageSlots:`, imageSlots)

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

    console.log(`🖼️ 섹션 ${section.id} 이미지 ${imageIndex}:`, photo)
    
    const imageContent = (
      <>
        {photo ? (
          <Image
            src={photo.originalUrl || photo.src || "/placeholder/photo-placeholder.svg"}
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
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-white text-center text-sm font-keepick-primary">
              사진 {imageIndex + 1}
            </div>
          </div>
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
                source: `section-${index}-${imageIndex}`, // sectionIndex 사용
                src: photo.src,
                thumbnailUrl: photo.thumbnailUrl,
                originalUrl: photo.originalUrl,
                name: photo.name
              }
              e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
              e.dataTransfer.effectAllowed = 'move'
              console.log('섹션에서 드래그 시작:', dragData)
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
          className="absolute top-4 right-4 z-50 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors duration-200"
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
                />
                <span className="text-[#FE7A25] font-keepick-primary text-sm">~</span>
                <input
                  type="date"
                  value={section.endDate || ''}
                  onChange={(e) => onSectionUpdate?.(index, 'endDate', e.target.value)}
                  className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider bg-transparent border border-[#FE7A25]/30 rounded px-2 py-1 focus:border-[#FE7A25] focus:outline-none [color-scheme:dark]"
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
  const dispatch = useDispatch()
  const { selectedPhotos, isFromGallery } = useSelector((state: RootState) => state.photoSelection)
  
  // 새로운 하이브리드 에디터 훅 사용
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
    setCoverImage,
    updateSection,
    addSection,
    deleteSection,
    updateAlbumInfo
  } = useTimelineEditor(groupId, albumId)

  const [isAlbumInfoModalOpen, setIsAlbumInfoModalOpen] = useState(false)
  const [isSelectingCoverImage, setIsSelectingCoverImage] = useState(false)
  const [dragOverImage, setDragOverImage] = useState<{ sectionIndex: number; imageIndex: number } | null>(null)

  // 갤러리에서 선택된 사진들로 앨범을 생성한 경우 자동으로 편집 모드 진입 + 앨범 정보 모달 자동 오픈
  useEffect(() => {
    if (isFromGallery && selectedPhotos.length > 0) {
      startEditing()
      setIsAlbumInfoModalOpen(true) // 앨범 정보 모달 자동 오픈
      console.log('갤러리에서 선택된 사진들로 타임라인 앨범 편집 시작:', selectedPhotos)
    }
  }, [isFromGallery, selectedPhotos, startEditing])

  const handleEditModeToggle = () => {
    if (isEditMode) {
      // 편집 완료 - 저장
      handleSave()
    } else {
      // 편집 모드 진입
      startEditing()
    }
  }

  const handleSave = async () => {
    try {
      await save()
      
      // 편집 완료 시 갤러리 상태 정리
      if (isFromGallery) {
        dispatch(clearSelectedPhotos())
        dispatch(setIsFromGallery(false))
      }
    } catch (error) {
      console.error('앨범 저장 실패:', error)
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
    console.log('🎯 하이브리드: 사진 드롭:', { sectionIndex, imageIndex, dragData })
    
    // 갤러리에서 섹션으로 이동
    if (dragData.source === 'gallery') {
      moveSidebarToSection(dragData.photoId, sectionIndex, imageIndex)
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
    console.log('🗑️ 하이브리드: 섹션에서 사진 제거:', dragData)
    
    // source에서 섹션 정보 파싱 (section-{sectionIndex}-{imageIndex})
    const sourceMatch = dragData.source.match(/section-(\\d+)-(\\d+)/)
    if (!sourceMatch) {
      console.warn('❌ 잘못된 source 형식:', dragData.source)
      return
    }
    
    const sectionIndex = parseInt(sourceMatch[1])
    const imageIndex = parseInt(sourceMatch[2])
    console.log('🗑️ 파싱된 정보:', { sectionIndex, imageIndex })
    
    // 하이브리드 방식으로 섹션에서 갤러리로 이동
    moveSectionToSidebar(sectionIndex, imageIndex)
  }

  // 앨범 정보 모달 핸들러들
  const handleAlbumInfoChange = (field: string, value: string | Photo | null) => {
    if (field === 'coverImage') {
      const photo = value as Photo | null
      if (photo) {
        setCoverImage(photo.id, photo)
      }
    } else if (field === 'title') {
      // 모달에서는 'title'이지만 내부적으로는 'name' 필드 사용
      updateAlbumInfo({ name: value as string })
    } else {
      updateAlbumInfo({ [field]: value })
    }
  }

  const handleCoverImageSelect = (photo: Photo) => {
    setCoverImage(photo.id, photo)
    setIsSelectingCoverImage(false)
  }

  const handleToggleCoverImageSelection = () => {
    setIsSelectingCoverImage(!isSelectingCoverImage)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">타임라인을 불러오는 중...</div>
          <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!albumInfo) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">타임라인 앨범을 찾을 수 없습니다</div>
          <Link href={`/group/${groupId}`} className="text-[#FE7A25] hover:underline">
            그룹 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <header 
        className={`fixed top-0 z-50 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800 transition-all duration-300 ${
          isEditMode ? 'left-[320px] right-0' : 'left-0 right-0'
        }`}
      >
        <div className="flex items-center justify-between px-8 py-4">
          <Link href={`/group/${groupId}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={20} />
            <span className="font-keepick-primary text-sm">돌아가기</span>
          </Link>
          <div className="text-center">
            <h1 className="font-keepick-heavy text-xl tracking-wider">
              {albumInfo.name}
            </h1>
          </div>
          <div className="flex gap-2">
            {/* 섹션 추가 버튼 */}
            {isEditMode && (
              <button
                onClick={handleAddSection}
                className="group relative p-px rounded-xl overflow-hidden bg-green-600 transition-all duration-300 transform hover:scale-105"
                title="섹션 추가"
              >
                <div className="bg-[#111111] rounded-[11px] px-4 py-2">
                  <div className="flex items-center gap-2 text-white">
                    <Plus size={16} />
                    <span className="font-keepick-primary text-sm">섹션 추가</span>
                  </div>
                </div>
              </button>
            )}
            
            {/* 편집/완료 버튼 */}
            <button
              onClick={handleEditModeToggle}
              disabled={isUpdating}
              className={`group relative p-px rounded-xl overflow-hidden bg-gray-700 transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r ${
                isEditMode
                  ? 'hover:from-green-500 hover:to-emerald-600'
                  : 'hover:from-[#FE7A25] hover:to-[#FF6B35]'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isEditMode ? '편집 완료' : '앨범 편집'}
            >
              <div className="bg-[#111111] rounded-[11px] px-5 py-2.5">
                <div className="relative flex items-center gap-2 text-white">
                  <Edit size={16} />
                  <span className="font-keepick-primary text-sm tracking-wide">
                    {isUpdating ? '저장 중...' : isEditMode ? '완료' : '수정'}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={`pt-20 bg-[#111111] transition-all duration-300 ${
          isEditMode ? 'ml-[320px]' : 'ml-0'
        }`}
      >
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
          />
        ))}
      </main>

      {/* Footer */}
      <footer 
        className={`bg-[#111111] border-t border-gray-800 py-16 transition-all duration-300 ${
          isEditMode ? 'ml-[320px]' : 'ml-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-keepick-heavy text-3xl md:text-4xl mb-4 tracking-wider">
            {albumInfo.name}
          </h2>
          <p className="font-keepick-primary text-gray-400 text-sm tracking-wider">
            {albumInfo.description}
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

      {/* Timeline Editing Sidebar */}
      <TimelineEditingSidebar 
        isOpen={isEditMode} 
        onClose={() => {
          cancelEditing()
          // 편집 취소 시에도 갤러리 상태 정리
          if (isFromGallery) {
            dispatch(clearSelectedPhotos())
            dispatch(setIsFromGallery(false))
          }
        }}
        onShowAlbumInfoModal={() => {
          setIsAlbumInfoModalOpen(true)
        }}
        onCoverImageDrop={(dragData) => {
          console.log('🖼️ 하이브리드: 대표이미지 드롭:', dragData)
          
          // DragPhotoData를 Photo로 변환
          const photo: Photo = {
            id: dragData.photoId,
            src: dragData.originalUrl || dragData.src || '/placeholder/photo-placeholder.svg',
            thumbnailUrl: dragData.thumbnailUrl,
            originalUrl: dragData.originalUrl,
            name: dragData.name || `사진 #${dragData.photoId}`
          }
          
          // 대표이미지로 설정
          setCoverImage(dragData.photoId, photo)
          
          // 섹션에서 온 사진인 경우 섹션에서도 제거
          if (dragData.source.startsWith('section-')) {
            handleSectionPhotoRemove(dragData)
          }
        }}
        onSectionPhotoRemove={handleSectionPhotoRemove}
        // 하이브리드 방식으로 데이터 전달
        availablePhotos={availablePhotos}
        coverImage={albumInfo.coverImage}
      />

      {/* Album Info Modal */}
      <AlbumInfoModal
        isOpen={isAlbumInfoModalOpen}
        onClose={() => setIsAlbumInfoModalOpen(false)}
        albumInfo={{
          title: albumInfo.name,
          startDate: albumInfo.startDate,
          endDate: albumInfo.endDate,
          description: albumInfo.description,
          coverImage: albumInfo.coverImage
        }}
        onAlbumInfoChange={handleAlbumInfoChange}
        onCoverImageSelect={handleCoverImageSelect}
        isSelectingCoverImage={isSelectingCoverImage}
        onToggleCoverImageSelection={handleToggleCoverImageSelection}
      />
    </div>
  )
}