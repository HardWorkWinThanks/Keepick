"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { useTimelineAlbum } from "../model/useTimelineAlbum"
import { TimelineEditingSidebar } from "./TimelineEditingSidebar"
import { AlbumInfoModal } from "./AlbumInfoModal"
import { PhotoDropZone } from "@/features/photo-drag-drop"
import type { TimelineEvent } from "@/entities/album"
import type { DragPhotoData } from "@/entities/photo"

interface TimelineAlbumPageProps {
  groupId: string
  albumId: string
}

// 섹션별 이미지 레이아웃 컴포넌트
function TimelineImageLayout({ 
  event, 
  index, 
  isEditMode = false,
  onImageDrop,
  dragOverImageIndex,
  onImageDragOver,
  onImageDragLeave,
  isSelectingCoverImage = false,
  onCoverImageSelect,
  selectedCoverImageId
}: { 
  event: TimelineEvent; 
  index: number;
  isEditMode?: boolean;
  onImageDrop?: (imageIndex: number, dragData: DragPhotoData) => void;
  dragOverImageIndex?: number | null;
  onImageDragOver?: (imageIndex: number) => void;
  onImageDragLeave?: () => void;
  isSelectingCoverImage?: boolean;
  onCoverImageSelect?: (photo: Photo) => void;
  selectedCoverImageId?: string;
}) {
  if (!event.images) return null

  const layoutProps = {
    0: { // Section 1: 큰 이미지 왼쪽 상단, 작은 이미지들 오른쪽 하단 겹침
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[15%] right-[5%] w-[35%] h-[35%] transform rotate-[3deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-5deg] z-15 overflow-hidden",
      filters: ["", "", ""]
    },
    1: { // Section 2: 큰 이미지 오른쪽, 작은 이미지들 왼쪽 하단
      mainClass: "absolute top-0 right-0 w-[65%] h-[70%] transform rotate-[1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[10%] left-[5%] w-[35%] h-[35%] transform rotate-[-4deg] z-20 overflow-hidden", 
      small2Class: "absolute bottom-[25%] left-[25%] w-[30%] h-[30%] transform rotate-[6deg] z-15 overflow-hidden",
      filters: ["grayscale", "", ""]
    },
    2: { // Section 3: 큰 이미지 왼쪽, 작은 이미지들 오른쪽
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[20%] right-[5%] w-[35%] h-[35%] transform rotate-[4deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-3deg] z-15 overflow-hidden",
      filters: ["contrast-150", "", "grayscale"]
    },
    3: { // Section 4: 큰 이미지 중앙-오른쪽, 작은 이미지들 하단
      mainClass: "absolute top-0 left-1/2 transform -translate-x-1/2 w-[60%] h-[65%] rotate-[2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[5%] left-[10%] w-[35%] h-[35%] transform rotate-[-2deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[10%] w-[35%] h-[35%] transform rotate-[5deg] z-15 overflow-hidden",
      filters: ["", "grayscale", ""]
    }
  }

  const layout = layoutProps[index % 4 as keyof typeof layoutProps]
  const imageClasses = [layout.mainClass, layout.small1Class, layout.small2Class]

  const createImageDropZone = (imageIndex: number, className: string, imageData: any, filter: string) => {
    const ImageWrapper = isEditMode && !isSelectingCoverImage ? PhotoDropZone : motion.div
    
    const isSelected = isSelectingCoverImage && imageData && selectedCoverImageId === imageData.id

    const baseProps = {
      className: `${className} ${
        isEditMode && dragOverImageIndex === imageIndex ? 'ring-2 ring-[#FE7A25]' : ''
      } ${
        isSelectingCoverImage ? 'cursor-pointer hover:ring-2 hover:ring-orange-300' : ''
      } ${
        isSelected ? 'ring-2 ring-orange-500' : ''
      }`
    }

    const editModeProps = isEditMode && !isSelectingCoverImage ? {
      onDrop: (dragData: DragPhotoData) => onImageDrop?.(imageIndex, dragData),
      onDragOver: () => onImageDragOver?.(imageIndex),
      onDragLeave: onImageDragLeave,
      isDragOver: dragOverImageIndex === imageIndex,
      dropZoneId: `image-${index}-${imageIndex}`
    } : !isSelectingCoverImage ? {
      initial: { opacity: 0, scale: 0.9, rotate: index % 2 === 0 ? -2 : 2 },
      whileInView: { opacity: 1, scale: 1, rotate: index % 2 === 0 ? -2 : 2 },
      transition: { duration: 0.6, delay: 0.3 + imageIndex * 0.2 },
      viewport: { once: true }
    } : {}

    const handleCoverImageClick = () => {
      if (isSelectingCoverImage && imageData && onCoverImageSelect) {
        onCoverImageSelect({
          id: imageData.id,
          src: imageData.src,
          name: imageData.name || `Timeline ${imageData.id}`
        })
      }
    }

    return (
      <ImageWrapper 
        key={`image-${imageIndex}`} 
        {...baseProps} 
        {...editModeProps}
        {...(isSelectingCoverImage ? { onClick: handleCoverImageClick } : {})}
      >
        <img
          src={imageData?.src || "/placeholder.svg"}
          alt={`${event.title} ${imageIndex === 0 ? 'main' : `detail ${imageIndex}`}`}
          className={`w-full h-full object-cover ${filter}`}
        />
        {isEditMode && !isSelectingCoverImage && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-white text-center text-sm font-keepick-primary">
              사진 {imageIndex + 1}
            </div>
          </div>
        )}
        {isSelectingCoverImage && isSelected && (
          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
        )}
      </ImageWrapper>
    )
  }

  return (
    <>
      {/* Main large image */}
      {createImageDropZone(0, layout.mainClass, event.images[0], layout.filters[0])}

      {/* Small image 1 */}
      {createImageDropZone(1, layout.small1Class, event.images[1], layout.filters[1])}

      {/* Small image 2 */}
      {createImageDropZone(2, layout.small2Class, event.images[2], layout.filters[2])}
    </>
  )
}

export default function TimelineAlbumPage({ groupId, albumId }: TimelineAlbumPageProps) {
  const { timelineEvents, loading } = useTimelineAlbum(groupId, albumId)
  const [isEditMode, setIsEditMode] = useState(false)
  const [dragOverImage, setDragOverImage] = useState<{ sectionIndex: number; imageIndex: number } | null>(null)
  const [editedEvents, setEditedEvents] = useState<{ [key: string]: Partial<TimelineEvent> }>({})
  const [editedImages, setEditedImages] = useState<{ [key: string]: any[] }>({})
  const [editedAlbumInfo, setEditedAlbumInfo] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    coverImage: null as Photo | null
  })
  const [isSelectingCoverImage, setIsSelectingCoverImage] = useState(false)
  const [showAlbumInfoModal, setShowAlbumInfoModal] = useState(false)

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode)
    if (!isEditMode) {
      // 편집 모드 진입 시 현재 데이터로 초기화
      const initialEditData: { [key: string]: Partial<TimelineEvent> } = {}
      const initialImageData: { [key: string]: any[] } = {}
      timelineEvents.forEach(event => {
        initialEditData[event.id] = {
          title: event.title,
          subtitle: event.subtitle,
          description: event.description,
          date: event.date
        }
        initialImageData[event.id] = [...(event.images || [])]
      })
      setEditedEvents(initialEditData)
      setEditedImages(initialImageData)
      // 앨범 정보 초기화 (더미 데이터)
      setEditedAlbumInfo({
        title: `ALBUM ${albumId} TIMELINE`,
        startDate: '2024.03.15',
        endDate: '2024.03.20',
        description: '소중한 순간들을 함께 나누는 공간',
        coverImage: dummyPhotos[0] // 첫 번째 사진을 기본 대표 이미지로
      })
    }
  }

  const handleAlbumInfoChange = (field: keyof typeof editedAlbumInfo, value: string | Photo | null) => {
    setEditedAlbumInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCoverImageSelect = (photo: Photo) => {
    setEditedAlbumInfo(prev => ({
      ...prev,
      coverImage: photo
    }))
    setIsSelectingCoverImage(false)
    setShowAlbumInfoModal(true) // 대표 이미지 선택 후 모달 다시 활성화
  }

  // 선택 가능한 모든 이미지 가져오기
  const getAllSelectableImages = (): Photo[] => {
    const allImages: Photo[] = [...dummyPhotos]
    
    // 타임라인 섹션의 모든 이미지들도 추가
    timelineEvents.forEach(event => {
      const eventImages = getDisplayImages(event)
      eventImages.forEach(image => {
        if (image && !allImages.find(existing => existing.id === image.id)) {
          allImages.push({
            id: image.id,
            src: image.src,
            name: image.name || `Timeline ${image.id}`
          })
        }
      })
    })
    
    return allImages
  }

  const handleImageDrop = (sectionIndex: number, imageIndex: number, dragData: DragPhotoData) => {
    const currentEvent = timelineEvents[sectionIndex]
    if (!currentEvent) return

    // 사이드바에서 드래그된 사진 찾기
    const draggedPhoto = dummyPhotos.find(photo => photo.id === dragData.photoId)
    if (!draggedPhoto) return

    // 현재 이미지와 새 이미지 교체
    setEditedImages(prev => {
      const currentImages = prev[currentEvent.id] || [...(currentEvent.images || [])]
      const oldImage = currentImages[imageIndex]
      
      // 새 이미지로 교체
      const newImages = [...currentImages]
      newImages[imageIndex] = draggedPhoto

      console.log("이미지 교체:", {
        section: sectionIndex,
        imageIndex,
        oldImage: oldImage?.src,
        newImage: draggedPhoto.src
      })

      return {
        ...prev,
        [currentEvent.id]: newImages
      }
    })

    setDragOverImage(null)
  }

  const handleImageDragOver = (sectionIndex: number, imageIndex: number) => {
    setDragOverImage({ sectionIndex, imageIndex })
  }

  const handleImageDragLeave = () => {
    setDragOverImage(null)
  }

  const handleTextChange = (eventId: string, field: keyof TimelineEvent, value: string) => {
    setEditedEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value
      }
    }))
  }

  const getDisplayValue = (event: TimelineEvent, field: keyof TimelineEvent): string => {
    if (isEditMode && editedEvents[event.id]?.[field] !== undefined) {
      return editedEvents[event.id][field] as string
    }
    return event[field] as string
  }

  const getDisplayImages = (event: TimelineEvent): any[] => {
    if (isEditMode && editedImages[event.id]) {
      return editedImages[event.id]
    }
    return event.images || []
  }

  // 더미 데이터를 상위 컴포넌트로 이동
  const dummyPhotos = [
    { id: "1", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop", name: "산 풍경 1" },
    { id: "2", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop", name: "숲 풍경" },
    { id: "3", src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&h=300&fit=crop", name: "바다 풍경" },
    { id: "4", src: "https://images.unsplash.com/photo-1418489098061-ce87b5dc3aee?w=300&h=300&fit=crop", name: "산 풍경 2" },
    { id: "5", src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=300&h=300&fit=crop", name: "호수 풍경" },
    { id: "6", src: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=300&fit=crop", name: "일출 풍경" },
    { id: "7", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop", name: "구름 풍경" },
    { id: "8", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop", name: "나무 풍경" },
  ]

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
            <h1 className="font-keepick-heavy text-xl tracking-wider">ALBUM {albumId} TIMELINE</h1>
            {isSelectingCoverImage && (
              <p className="text-sm text-[#FE7A25] font-keepick-primary mt-1">대표 이미지를 선택하세요</p>
            )}
          </div>
          <button
            onClick={handleEditModeToggle}
            className={`group relative p-px rounded-xl overflow-hidden bg-gray-700 transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r ${
              isEditMode
                ? 'hover:from-green-500 hover:to-emerald-600'
                : 'hover:from-[#FE7A25] hover:to-[#FF6B35]'
            }`}
            title={isEditMode ? '편집 완료' : '앨범 편집'}
          >
            <div className="bg-[#111111] rounded-[11px] px-5 py-2.5">
              <div className="relative flex items-center gap-2 text-white">
                <Edit size={16} />
                <span className="font-keepick-primary text-sm tracking-wide">
                  {isEditMode ? '완료' : '수정'}
                </span>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={`pt-20 bg-[#111111] transition-all duration-300 ${
          isEditMode ? 'ml-[320px]' : 'ml-0'
        }`}
      >
        {timelineEvents.map((event, index) => (
          <motion.section
            key={event.id}
            id={`section-${index}`}
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="min-h-screen flex items-center justify-center px-8 py-16 bg-[#111111]"
          >
            <div className="max-w-7xl w-full">
              <div
                className={`grid grid-cols-12 gap-8 items-center ${index % 2 === 0 ? "" : "lg:grid-flow-col-dense"}`}
              >
                {/* Text Content */}
                <div
                  className={`col-span-12 lg:col-span-5 space-y-6 ${
                    index % 2 === 0 ? "lg:pr-12" : "lg:pl-12 lg:col-start-8"
                  }`}
                >
                  {/* Date */}
                  {isEditMode ? (
                    <input
                      type="text"
                      value={getDisplayValue(event, 'date')}
                      onChange={(e) => handleTextChange(event.id, 'date', e.target.value)}
                      className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider bg-transparent border border-[#FE7A25]/30 rounded px-2 py-1 focus:border-[#FE7A25] focus:outline-none"
                      placeholder="날짜를 입력하세요"
                      onDrop={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                    />
                  ) : (
                    <div className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider">{event.date}</div>
                  )}

                  {/* Main Title */}
                  {isEditMode ? (
                    <textarea
                      value={getDisplayValue(event, 'title')}
                      onChange={(e) => handleTextChange(event.id, 'title', e.target.value)}
                      className="font-keepick-heavy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide bg-transparent border border-white/30 rounded px-3 py-2 focus:border-white focus:outline-none text-white resize-none overflow-hidden w-full"
                      placeholder="제목을 입력하세요"
                      rows={Math.max(2, getDisplayValue(event, 'title').split('\n').length)}
                      style={{ height: 'auto', minHeight: '120px' }}
                      onDrop={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                    />
                  ) : (
                    <h2 className="font-keepick-heavy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide">
                      {event.title.split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </h2>
                  )}

                  {/* Subtitle */}
                  {isEditMode ? (
                    <textarea
                      value={getDisplayValue(event, 'subtitle') || ''}
                      onChange={(e) => handleTextChange(event.id, 'subtitle', e.target.value)}
                      className="font-keepick-primary text-lg md:text-xl text-gray-400 tracking-widest bg-transparent border border-gray-500/30 rounded px-3 py-2 focus:border-gray-400 focus:outline-none resize-none overflow-hidden w-full"
                      placeholder="부제목을 입력하세요 (선택사항)"
                      rows={Math.max(1, Math.ceil((getDisplayValue(event, 'subtitle') || '').split('\n').length) || 1)}
                      style={{ height: 'auto', minHeight: '40px' }}
                      onDrop={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                    />
                  ) : (
                    event.subtitle && (
                      <h3 className="font-keepick-primary text-lg md:text-xl text-gray-400 tracking-widest">
                        {event.subtitle.split("\n").map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </h3>
                    )
                  )}

                  {/* Description */}
                  {isEditMode ? (
                    <textarea
                      value={getDisplayValue(event, 'description')}
                      onChange={(e) => handleTextChange(event.id, 'description', e.target.value)}
                      className="font-keepick-primary text-gray-300 leading-relaxed text-base md:text-lg bg-transparent border border-gray-500/30 rounded px-3 py-2 focus:border-gray-400 focus:outline-none resize-none overflow-hidden"
                      placeholder="설명을 입력하세요"
                      rows={Math.max(3, Math.ceil(getDisplayValue(event, 'description').length / 40) + getDisplayValue(event, 'description').split('\n').length)}
                      style={{ width: '100%', maxWidth: '28rem', height: 'auto', minHeight: '80px' }}
                      onDrop={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                    />
                  ) : (
                    <p className="font-keepick-primary text-gray-300 leading-relaxed text-base md:text-lg max-w-md">
                      {event.description}
                    </p>
                  )}

                </div>

                {/* Images Collage */}
                <div
                  className={`col-span-12 lg:col-span-7 relative h-[500px] md:h-[600px] ${
                    index % 2 === 0 ? "" : "lg:col-start-1"
                  }`}
                >
                  <TimelineImageLayout 
                    event={{ ...event, images: getDisplayImages(event) }}
                    index={index}
                    isEditMode={isEditMode}
                    onImageDrop={(imageIndex, dragData) => handleImageDrop(index, imageIndex, dragData)}
                    dragOverImageIndex={dragOverImage?.sectionIndex === index ? dragOverImage.imageIndex : null}
                    onImageDragOver={(imageIndex) => handleImageDragOver(index, imageIndex)}
                    onImageDragLeave={handleImageDragLeave}
                    isSelectingCoverImage={isSelectingCoverImage}
                    onCoverImageSelect={handleCoverImageSelect}
                    selectedCoverImageId={editedAlbumInfo.coverImage?.id}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        ))}
      </main>

      {/* Footer */}
      <footer 
        className={`bg-[#111111] border-t border-gray-800 py-16 transition-all duration-300 ${
          isEditMode ? 'ml-[320px]' : 'ml-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-keepick-heavy text-3xl md:text-4xl mb-4 tracking-wider">ALBUM {albumId}</h2>
          <p className="font-keepick-primary text-gray-400 text-sm tracking-wider">소중한 순간들을 함께 나누는 공간</p>
          <div className="mt-8 flex justify-center gap-8 text-sm font-keepick-primary text-gray-500">
            <Link href={`/group/${groupId}`} className="hover:text-white transition-colors">
              홈
            </Link>
            <Link href={`/group/${groupId}/gallery`} className="hover:text-white transition-colors">
              갤러리
            </Link>
          </div>
        </div>
      </footer>

      {/* Timeline Editing Sidebar */}
      <TimelineEditingSidebar 
        isOpen={isEditMode} 
        onClose={() => setIsEditMode(false)}
        availablePhotos={dummyPhotos}
        onShowAlbumInfoModal={() => setShowAlbumInfoModal(true)}
      />

      {/* Album Info Modal */}
      <AlbumInfoModal
        isOpen={showAlbumInfoModal}
        onClose={() => setShowAlbumInfoModal(false)}
        albumInfo={editedAlbumInfo}
        onAlbumInfoChange={handleAlbumInfoChange}
        onCoverImageSelect={handleCoverImageSelect}
        isSelectingCoverImage={isSelectingCoverImage}
        onToggleCoverImageSelection={() => setIsSelectingCoverImage(!isSelectingCoverImage)}
      />
    </div>
  )
}