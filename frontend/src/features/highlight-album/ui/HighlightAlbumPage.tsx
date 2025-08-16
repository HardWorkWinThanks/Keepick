"use client"

import { useState, useEffect } from "react"
import { ZoomIn, ArrowLeft, Settings, Grid3x3, LayoutList } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useHighlightAlbum } from "../model/useHighlightAlbum"
import { CardStack } from "./CardStack"
import { GridView } from "./GridView"
import type { Photo, DragPhotoData } from "@/entities/photo"

interface HighlightAlbumPageProps {
  groupId: string
  albumId: string
}

export function HighlightAlbumPage({ groupId, albumId }: HighlightAlbumPageProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isGridView, setIsGridView] = useState(false)
  
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
                {album.name || 'HIGHLIGHT ALBUM'}
              </h1>
            </div>
            
            {/* 오른쪽 영역 - 버튼들 */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={toggleEditMode}
                className={`group relative px-4 py-2 text-white transition-all duration-300 ${
                  isEditMode
                    ? 'hover:text-green-400'
                    : 'hover:text-[#FE7A25]'
                }`}
                title={isEditMode ? '편집 완료' : '앨범 편집'}
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} />
                  <span className="font-keepick-primary text-sm tracking-wide">
                    {isEditMode ? '완료' : '수정'}
                  </span>
                </div>
                <div className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isEditMode ? 'bg-green-400' : 'bg-[#FE7A25]'
                }`}></div>
              </button>
            </div>
          </div>
        </header>

        {/* 뷰 전환 버튼 - 4개 섹션의 교차점 */}
        <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-28 -translate-y-1/2" style={{ marginLeft: '86px' }}>
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="bg-black/80 border border-white/20 rounded-full p-3 text-white hover:bg-black/90 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            title={isGridView ? "카드 스택 뷰" : "그리드 뷰"}
          >
            {isGridView ? (
              <LayoutList size={24} />
            ) : (
              <Grid3x3 size={24} />
            )}
          </button>
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
              {isGridView ? (
                <div className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center">
                  <GridView 
                    photos={photos}
                    emotion={emotion}
                    emotionColor={emotionColors[emotion as keyof typeof emotionColors]}
                  />
                </div>
              ) : (
                <div className="absolute top-32 left-1/2 transform -translate-x-24">
                  <CardStack 
                    photos={photos}
                    emotion={emotion}
                    emotionColor={emotionColors[emotion as keyof typeof emotionColors]}
                    hideNavigation={isGridView}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>
  )
}