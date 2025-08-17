"use client"

import { useState, useEffect } from "react"
import { ZoomIn, ArrowLeft, Settings, Grid3x3, LayoutList, Edit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useHighlightAlbum } from "../model/useHighlightAlbum"
import { CardStack } from "./CardStack"
import { GridView } from "./GridView"
import { AlbumInfoEditModal, type EditingAlbumInfo } from "@/shared/ui/modal/AlbumInfoEditModal"
import type { Photo, DragPhotoData } from "@/entities/photo"

interface HighlightAlbumPageProps {
  groupId: string
  albumId: string
}

export function HighlightAlbumPage({ groupId, albumId }: HighlightAlbumPageProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isGridView, setIsGridView] = useState(false)
  const [isAlbumInfoModalOpen, setIsAlbumInfoModalOpen] = useState(false)
  const [isSelectingCoverImage, setIsSelectingCoverImage] = useState(false)
  const [tempCoverImageId, setTempCoverImageId] = useState<number | null>(null)
  
  // 앨범 정보 상태 (실제로는 API에서 가져와야 함)
  const [albumInfo, setAlbumInfo] = useState<EditingAlbumInfo>({
    name: "즐거운 화상통화",
    description: "친구들과의 재미있는 시간들"
  })
  
  // 현재 대표이미지 상태
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  
  const {
    album,
    emotionIcons,
    emotionLabels,
    emotionColors,
    handleSectionZoom,
    handleEmotionClick,
    photoSlides,
    handlePrevSlide,
    handleNextSlide,
  } = useHighlightAlbum(groupId, albumId)
  
  // 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }
  
  // 앨범 정보 업데이트 핸들러
  const handleAlbumInfoUpdate = (updates: Partial<EditingAlbumInfo>) => {
    setAlbumInfo(prev => ({ ...prev, ...updates }))
  }
  
  // 대표이미지 선택 모드 시작
  const handleStartCoverImageSelection = () => {
    setIsSelectingCoverImage(true)
    setIsAlbumInfoModalOpen(false) // 모달 닫기
  }
  
  // 사진 클릭으로 대표이미지 선택
  const handlePhotoClick = (photoId: number, photoUrl: string) => {
    if (isSelectingCoverImage) {
      setTempCoverImageId(photoId)
      setCoverImageUrl(photoUrl)
      setIsSelectingCoverImage(false)
      setIsAlbumInfoModalOpen(true) // 모달 다시 열기
    }
  }
  
  // 대표이미지 선택 취소
  const handleCancelCoverImageSelection = () => {
    setIsSelectingCoverImage(false)
    setIsAlbumInfoModalOpen(true) // 모달 다시 열기
  }
  
  // 편집 모드 변경 시 URL 업데이트
  useEffect(() => {
    const url = new URL(window.location.href)
    if (isEditMode) {
      url.searchParams.set('edit', 'true')
    } else {
      url.searchParams.delete('edit')
    }
    window.history.replaceState({}, '', url.toString())
  }, [isEditMode])

  return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 right-0 z-40 bg-[#111111] border-b border-gray-800 transition-all duration-200"
                style={{ left: '240px', width: 'calc(100% - 240px)' }}>
          <div className="relative flex items-center py-2 px-8">
            {/* 왼쪽 영역 - 고정 너비 */}
            <div className="flex items-center" style={{ width: '200px' }}>
              <Link href={`/group/${groupId}?album=highlight`} className="flex items-center gap-3 hover:opacity-70 transition-opacity text-white">
                <ArrowLeft size={20} />
                <span className="font-keepick-primary text-sm">돌아가기</span>
              </Link>
            </div>
            
            {/* 중앙 제목 - 절대 위치로 중앙 고정 */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="font-keepick-heavy text-xl tracking-wider text-center text-white">
                {albumInfo.name || 'HIGHLIGHT ALBUM'}
              </h1>
            </div>
            
            {/* 오른쪽 영역 - 버튼들 */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setIsAlbumInfoModalOpen(true)}
                className="group relative px-4 py-2 text-white hover:text-[#FE7A25] transition-all duration-300"
                title="앨범 정보 수정"
              >
                <div className="flex items-center gap-2">
                  <Edit size={16} />
                  <span className="font-keepick-primary text-sm tracking-wide">
                    수정
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FE7A25] transition-all duration-300 group-hover:w-full"></div>
              </button>
            </div>
          </div>
        </header>

        {/* 뷰 전환 버튼 - 4개 섹션의 교차점 */}
        <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-28 -translate-y-1/2" style={{ marginLeft: '86px' }}>
          <motion.button
            onClick={() => setIsGridView(!isGridView)}
            className="bg-black/80 border border-white/20 rounded-full p-3 text-white backdrop-blur-sm"
            title={isGridView ? "카드 스택 뷰" : "그리드 뷰"}
            whileHover={{ 
              scale: 1.1,
              backgroundColor: "rgba(0,0,0,0.9)",
              borderColor: "rgba(254, 122, 37, 0.5)"
            }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              rotate: isGridView ? 180 : 0 
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            <AnimatePresence mode="wait">
              {isGridView ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <LayoutList size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Grid3x3 size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

      {/* Four Quadrants with Clear Separation */}
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 bg-[#111111]">
        {Object.entries(album.photos).map(([emotion, photos], index) => {
          return (
            <div
              key={emotion}
              className="relative h-full bg-[#111111] border-2 border-white"
            >

              {/* Emotion Label - 상단 고정 */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
                <div className="w-8 h-8 md:w-10 md:h-10">
                  <Image
                    src={emotionIcons[emotion as keyof typeof emotionIcons] || "/placeholder.svg"}
                    alt={emotion}
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-line-seed-heavy text-white drop-shadow-lg">
                    {emotionLabels[emotion as keyof typeof emotionLabels]}
                  </h3>
                </div>
              </div>

              {/* Card Stack / Grid Section - 뷰 모드에 따라 전환 */}
              <AnimatePresence mode="wait">
                {isGridView ? (
                  <motion.div 
                    key={`grid-${emotion}`}
                    className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeInOut"
                    }}
                  >
                    <GridView 
                      photos={photos}
                      emotion={emotion}
                      emotionColor={emotionColors[emotion as keyof typeof emotionColors]}
                      onPhotoClick={handlePhotoClick}
                      isSelectingCoverImage={isSelectingCoverImage}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key={`stack-${emotion}`}
                    className="absolute top-32 left-1/2 transform -translate-x-24"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeInOut"
                    }}
                  >
                    <CardStack 
                      photos={photos}
                      emotion={emotion}
                      emotionColor={emotionColors[emotion as keyof typeof emotionColors]}
                      hideNavigation={isGridView}
                      onPhotoClick={handlePhotoClick}
                      isSelectingCoverImage={isSelectingCoverImage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      
      {/* 앨범 정보 수정 모달 */}
      <AlbumInfoEditModal
        isOpen={isAlbumInfoModalOpen}
        onClose={() => setIsAlbumInfoModalOpen(false)}
        albumInfo={albumInfo}
        onAlbumInfoUpdate={handleAlbumInfoUpdate}
        showDateInputs={false}
        title="하이라이트 앨범 정보 수정"
        albumType="tier"
        coverImageUrl={coverImageUrl}
        onCoverImageClick={handleStartCoverImageSelection}
        isSelectingCoverImage={isSelectingCoverImage}
        onSave={async () => {
          // 실제로는 API 호출이 필요
          console.log('앨범 정보 저장:', albumInfo)
          console.log('대표이미지 ID:', tempCoverImageId)
          setIsAlbumInfoModalOpen(false)
        }}
      />
      
      </div>
  )
}