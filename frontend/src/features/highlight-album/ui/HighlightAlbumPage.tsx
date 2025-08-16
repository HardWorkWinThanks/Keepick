"use client"

import { ZoomIn, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useHighlightAlbum } from "../model/useHighlightAlbum"

interface HighlightAlbumPageProps {
  groupId: string
  albumId: string
}

export function HighlightAlbumPage({ groupId, albumId }: HighlightAlbumPageProps) {
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

  return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between px-8 py-4">
            <Link href={`/group/${groupId}?album=highlight`} className="flex items-center gap-3 hover:opacity-70 transition-opacity text-white">
              <ArrowLeft size={20} className="text-white" />
              <span className="font-keepick-primary text-sm text-white">돌아가기</span>
            </Link>
            <div className="text-center">
              <h1 className="font-keepick-heavy text-xl tracking-wider text-white">HIGHLIGHT ALBUM {albumId}</h1>
            </div>
            <div className="w-24"></div> {/* 균형을 위한 빈 공간 */}
          </div>
        </header>

      {/* Cross Lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-30"></div>
        <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-orange-400 to-transparent opacity-30"></div>
      </div>

      {/* Four Quadrants with Clear Separation */}
      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 h-screen pt-16 gap-0.5 bg-orange-400/20">
        {Object.entries(album.emotions).map(([emotion, photos], index) => {
          const getZoomButtonPosition = (index: number) => {
            if (index === 0) return "top-4 right-4"
            if (index === 1) return "top-4 right-4"
            if (index === 2) return "top-4 right-4"
            return "top-4 right-4"
          }

          return (
            <div
              key={emotion}
              className="relative p-4 md:p-6 flex flex-col h-full bg-black border border-orange-400/30"
            >
              {/* Zoom Button */}
              <button
                onClick={() => handleSectionZoom(emotion)}
                className={`absolute ${getZoomButtonPosition(index)} z-10 p-2 text-orange-400 hover:text-orange-300 transition-all duration-300 hover:scale-110 group`}
                aria-label={`${emotion} 섹션 확대`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSectionZoom(emotion)
                  }
                }}
              >
                <ZoomIn size={18} className="drop-shadow-lg" />
                <div className="absolute inset-0 rounded-full bg-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>

              {/* Emotion Label */}
              <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10">
                  <Image
                    src={emotionIcons[emotion as keyof typeof emotionIcons] || "/placeholder.svg"}
                    alt={emotion}
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-3xl font-line-seed-heavy text-white">
                    {emotionLabels[emotion as keyof typeof emotionLabels]}
                  </h3>
                </div>
              </div>

              {/* Photos Section with Navigation */}
              <div className="flex-1 min-h-0 relative">
                {photos.length > 0 && (
                  <>
                    {/* Navigation Arrows */}
                    {photos.length > 6 && (
                      <>
                        <button
                          onClick={() => handlePrevSlide(emotion)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all duration-200 hover:scale-110"
                          disabled={photoSlides[emotion]?.currentSlide === 0}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={() => handleNextSlide(emotion)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all duration-200 hover:scale-110"
                          disabled={photoSlides[emotion]?.currentSlide >= Math.ceil(photos.length / 6) - 1}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    
                    {/* Photos Grid - Fixed Height */}
                    <div className="h-full">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 h-full">
                        {photos
                          .slice(
                            (photoSlides[emotion]?.currentSlide || 0) * 6,
                            ((photoSlides[emotion]?.currentSlide || 0) + 1) * 6
                          )
                          .map((photo, photoIndex) => {
                            const actualIndex = (photoSlides[emotion]?.currentSlide || 0) * 6 + photoIndex;
                            return (
                              <div
                                key={actualIndex}
                                className="relative border-2 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-lg bg-gray-900/50"
                                style={{
                                  borderColor: emotionColors[emotion as keyof typeof emotionColors],
                                  height: '50%', // 2행에 맞춰 높이 조정             
                                }}
                                onClick={() => handleEmotionClick(emotion)}
                                tabIndex={0}
                                role="button"
                                aria-label={`${emotion} 감정 사진 ${actualIndex + 1}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleEmotionClick(emotion)
                                  }
                                }}
                              >
                                <Image
                                  src={ photo || "/presentation/surprise_018.jpg"}
                                  alt={`${emotion} ${actualIndex + 1}`}
                                  fill
                                  className="object-cover pointer-events-none"
                                  draggable={false}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    
                    {/* Pagination Dots */}
                    {photos.length > 6 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {Array.from({ length: Math.ceil(photos.length / 6) }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === (photoSlides[emotion]?.currentSlide || 0)
                                ? 'bg-orange-400'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      </div>
  )
}