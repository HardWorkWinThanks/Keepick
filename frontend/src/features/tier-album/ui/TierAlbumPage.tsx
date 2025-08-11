"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useTierAlbum } from "../model/useTierAlbum"
import type { TierInfo, TierType } from "../types"

interface TierAlbumPageProps {
  groupId: string
  albumId: string
}

// 티어 정보
const tiers: TierInfo[] = [
  { id: "S", name: "S", color: "#FE7A25" },
  { id: "A", name: "A", color: "#4ECDC4" },
  { id: "B", name: "B", color: "#45B7D1" },
  { id: "C", name: "C", color: "#96CEB4" },
  { id: "D", name: "D", color: "#FFEAA7" },
]

// Tilt Shine Card 컴포넌트
interface TiltShineCardProps {
  children: React.ReactNode
  tierColor: string
  className?: string
}

const TiltShineCard: React.FC<TiltShineCardProps> = ({ children, tierColor, className = "" }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [shine, setShine] = useState({ x: 50, y: 50 })
  const rafRef = useRef<number>()

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!wrapperRef.current) return
    
    // 애니메이션 프레임 최적화
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const tiltX = (e.clientY - cy) / 15 // 감도 줄임
      const tiltY = (cx - e.clientX) / 15 // 감도 줄임
      const shineX = ((e.clientX - rect.left) / rect.width) * 100
      const shineY = ((e.clientY - rect.top) / rect.height) * 100
      setTilt({ x: Math.max(-10, Math.min(10, tiltX)), y: Math.max(-10, Math.min(10, tiltY)) }) // 각도 제한 줄임
      setShine({ x: shineX, y: shineY })
    })
  }

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setTilt({ x: 0, y: 0 })
    setShine({ x: 50, y: 50 })
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 카드 본체 */}
      <div className="relative rounded-lg overflow-hidden shadow-2xl cursor-pointer bg-black">
        {/* Shine (스팟 하이라이트) - 성능 최적화 */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-20 rounded-lg"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.6) 0%, transparent 40%)`,
            transition: shine.x === 50 && shine.y === 50 ? "background 0.4s ease-out" : "none",
          }}
        />

        {/* 추가 글로우 (부드러운 색 번짐) - 성능 최적화 */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none z-20 rounded-lg"
          style={{
            background: `linear-gradient(45deg, transparent 35%, ${tierColor}15 50%, transparent 65%)`,
            transform: `translateX(${(shine.x - 50) / 3}px) translateY(${(shine.y - 50) / 3}px)`,
            transition: shine.x === 50 && shine.y === 50 ? "transform 0.4s ease-out" : "none",
          }}
        />

        {children}
      </div>
    </div>
  )
}

export default function TierAlbumPage({ groupId, albumId }: TierAlbumPageProps) {
  const {
    isLoading,
    currentTier,
    currentPhotoIndex,
    currentTierPhotos,
    currentPhoto,
    setCurrentTier,
    getTierCount,
    goToPrevPhoto,
    goToNextPhoto,
    goToPhoto,
  } = useTierAlbum(groupId, albumId)

  const currentTierInfo = tiers.find((tier) => tier.id === currentTier)!

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">티어 앨범을 불러오는 중...</div>
          <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${currentTierInfo.color}40 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${currentTierInfo.color}20 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Header - timeline-album 헤더와 통합된 스타일 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href={`/group/${groupId}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={20} />
            <span className="font-keepick-primary text-sm">돌아가기</span>
          </Link>
          <div className="text-center">
            <h1 className="font-keepick-heavy text-xl tracking-wider">TIER ALBUM {albumId}</h1>
          </div>
          <button className="px-6 py-2 border-2 border-orange-500 hover:border-orange-400 text-orange-500 hover:text-orange-400 bg-transparent font-keepick-primary text-sm rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25">
            티어 수정하기
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-screen flex flex-col pt-16 relative z-10">
        {/* Left Top: Tier Title & Navigation */}
        <div className="absolute top-24 left-8 z-40">
          {/* Large Tier Character with "Tier" text */}
          <div className="flex items-baseline gap-3 mb-4">
            <motion.h1
              key={currentTier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-8xl md:text-9xl font-line-seed-heavy tracking-wider"
              style={{ color: currentTierInfo.color }}
            >
              {currentTier}
            </motion.h1>
            <span
              className="text-2xl font-line-seed-heavy tracking-widest opacity-80"
              style={{
                color: currentTierInfo.color,
                textShadow: `0 0 10px ${currentTierInfo.color}40`,
              }}
            >
              TIER
            </span>
          </div>

          <div className="mb-4">
            <p className="font-line-seed text-gray-400 text-sm mb-1">
              {currentTier === "S" && "최고의 순간들"}
              {currentTier === "A" && "특별한 기억들"}
              {currentTier === "B" && "좋은 추억들"}
              {currentTier === "C" && "일상의 모습들"}
              {currentTier === "D" && "아쉬운 사진들"}
            </p>
            <p className="font-line-seed text-gray-500 text-xs">{getTierCount(currentTier)}장의 사진</p>
          </div>

          {/* Minimal Tier Navigation */}
          <div className="flex gap-2 mb-6">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setCurrentTier(tier.id)}
                className={`w-8 h-8 rounded-full text-sm font-line-seed-heavy transition-all duration-300 relative ${
                  currentTier === tier.id
                    ? "text-black"
                    : "text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500"
                }`}
                style={{
                  backgroundColor: currentTier === tier.id ? tier.color : "transparent",
                }}
              >
                {tier.name}
              </button>
            ))}
          </div>

          {/* Tier Distribution Bar Chart */}
          <div className="max-w-xs">
            <p className="font-line-seed text-xs text-gray-500 mb-2">티어별 분포</p>
            <div className="space-y-1">
              {tiers.map((tier) => {
                const count = getTierCount(tier.id)
                const percentage = (count / 23) * 100 // 전체 사진 수
                return (
                  <div key={tier.id} className="flex items-center gap-2">
                    <span className="font-line-seed text-xs w-4" style={{ color: tier.color }}>
                      {tier.name}
                    </span>
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: tier.color,
                        }}
                      />
                    </div>
                    <span className="font-line-seed text-xs text-gray-500 w-6">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {currentTierPhotos.length > 0 && (
          <div className="absolute top-24 right-8 z-40">
            <motion.div
              key={`${currentTier}-${currentPhotoIndex}-info`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 w-48"
            >
              <h3 className="font-line-seed-heavy text-base mb-2" style={{ color: currentTierInfo.color }}>
                사진 #{currentPhotoIndex + 1}
              </h3>
              <p className="font-line-seed text-gray-400 text-xs mb-3">{currentPhoto.date}</p>

              <div className="space-y-1.5 text-xs font-line-seed text-gray-500">
                <div className="flex justify-between">
                  <span>등급</span>
                  <span style={{ color: currentTierInfo.color }}>{currentTier}급</span>
                </div>
                <div className="flex justify-between">
                  <span>순서</span>
                  <span>
                    {currentPhotoIndex + 1} / {currentTierPhotos.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>전체</span>
                  <span>23장 중</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modern Carousel with Tilt Shine Card */}
        <div className="flex-1 relative flex items-center justify-center">
          {currentTierPhotos.length > 0 && (
            <>
              {/* Main Photo with Tilt Shine Effect */}
              <motion.div
                key={`${currentTier}-${currentPhotoIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative"
              >
                <TiltShineCard tierColor={currentTierInfo.color} className="max-w-4xl max-h-[70vh]">
                  <img
                    src={currentPhoto.src || "/placeholder.svg"}
                    alt={currentPhoto.title}
                    className="w-full h-full object-contain max-w-4xl max-h-[70vh]"
                    draggable={false}
                  />
                </TiltShineCard>
              </motion.div>

              {/* Navigation Arrows */}
              {currentTierPhotos.length > 1 && (
                <>
                  <button
                    onClick={goToPrevPhoto}
                    className="absolute left-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-30"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button
                    onClick={goToNextPhoto}
                    className="absolute right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-30"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Bottom: Small Thumbnail Strip */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            {currentTierPhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => goToPhoto(index)}
                className={`w-12 h-12 rounded overflow-hidden transition-all duration-300 relative ${
                  index === currentPhotoIndex ? "ring-2 scale-110" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  ringColor: index === currentPhotoIndex ? currentTierInfo.color : "transparent",
                }}
              >
                <img src={photo.src || "/placeholder.svg"} alt={photo.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-line-seed text-xs text-white">{index + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Counter - Bottom Right */}
        {currentTierPhotos.length > 0 && (
          <div className="absolute bottom-8 right-8">
            <p className="font-line-seed text-gray-400 text-sm">
              {currentPhotoIndex + 1} / {currentTierPhotos.length}
            </p>
          </div>
        )}

        {/* Empty State */}
        {currentTierPhotos.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="font-line-seed text-gray-400 text-lg mb-4">{currentTierInfo.name}등급에 사진이 없습니다</p>
              <Link href="/gallery" className="font-line-seed text-orange-500 hover:text-orange-400 transition-colors">
                갤러리에서 선택하기
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}