'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import Image from "next/image"

interface KeepickMainLandingRef {
  spillPhotos: () => void
}

const KeepickMainLanding = forwardRef<KeepickMainLandingRef>((props, ref) => {
  const [mounted, setMounted] = useState(false)
  const [logoVisible, setLogoVisible] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [scale, setScale] = useState(1)

  // 타이머 참조들
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)


  // 기본 앨범 데이터 (V35 원본 그대로)
  const baseAlbumData = [
    { id: 1, baseWidth: 280, baseHeight: 280, rotation: -15 },
    { id: 2, baseWidth: 240, baseHeight: 320, rotation: 25 },
    { id: 3, baseWidth: 250, baseHeight: 200, rotation: -20 },
    { id: 4, baseWidth: 300, baseHeight: 250, rotation: 35 },
    { id: 5, baseWidth: 220, baseHeight: 280, rotation: -30 },
    { id: 6, baseWidth: 270, baseHeight: 270, rotation: 18 },
    { id: 7, baseWidth: 260, baseHeight: 240, rotation: -12 },
    { id: 8, baseWidth: 290, baseHeight: 220, rotation: 40 },
    { id: 9, baseWidth: 320, baseHeight: 300, rotation: -25 },
    { id: 10, baseWidth: 280, baseHeight: 350, rotation: 22 },
    { id: 11, baseWidth: 300, baseHeight: 260, rotation: -8 },
    { id: 12, baseWidth: 240, baseHeight: 300, rotation: 32 },
    { id: 13, baseWidth: 310, baseHeight: 240, rotation: -18 },
    { id: 14, baseWidth: 250, baseHeight: 280, rotation: 15 },
    { id: 15, baseWidth: 270, baseHeight: 320, rotation: -35 },
    { id: 16, baseWidth: 280, baseHeight: 280, rotation: -22 },
    { id: 17, baseWidth: 240, baseHeight: 320, rotation: 30 },
    { id: 18, baseWidth: 300, baseHeight: 220, rotation: -15 },
    { id: 19, baseWidth: 260, baseHeight: 290, rotation: 25 },
    { id: 20, baseWidth: 320, baseHeight: 280, rotation: 12 },
  ]

  // 고정된 위치들 (V35 원본 그대로)
  const positions = [
    { x: '8%', y: '8%', zIndex: 2, opacity: 1.0 },
    { x: '18%', y: '25%', zIndex: 5, opacity: 1.0 },
    { x: '12%', y: '45%', zIndex: 3, opacity: 1.0 },
    { x: '25%', y: '5%', zIndex: 7, opacity: 1.0 },
    { x: '12%', y: '65%', zIndex: 4, opacity: 1.0 },
    { x: '28%', y: '35%', zIndex: 8, opacity: 1.0 },
    { x: '2%', y: '78%', zIndex: 6, opacity: 1.0 },
    { x: '25%', y: '68%', zIndex: 9, opacity: 1.0 },
    { x: '38%', y: '12%', zIndex: 12, opacity: 1.0 },
    { x: '45%', y: '28%', zIndex: 15, opacity: 1.0 },
    { x: '52%', y: '8%', zIndex: 18, opacity: 1.0 },
    { x: '42%', y: '52%', zIndex: 14, opacity: 1.0 },
    { x: '58%', y: '35%', zIndex: 20, opacity: 1.0 },
    { x: '35%', y: '75%', zIndex: 11, opacity: 1.0 },
    { x: '48%', y: '65%', zIndex: 16, opacity: 1.0 },
    { x: '65%', y: '15%', zIndex: 13, opacity: 1.0 },
    { x: '75%', y: '8%', zIndex: 10, opacity: 1.0 },
    { x: '70%', y: '35%', zIndex: 17, opacity: 1.0 },
    { x: '62%', y: '55%', zIndex: 21, opacity: 1.0 },
    { x: '72%', y: '72%', zIndex: 22, opacity: 1.0 },
  ]

  // SSR 안전한 초기 상태 (고정값)
  const getInitialAlbumCovers = () => {
    return baseAlbumData.map((album, index) => ({
      ...album,
      ...positions[index],
      // SSR에서는 좌상단 고정 위치
      initialX: -420,
      initialY: -180,
      delay: 0.1 + (index * 0.05),
      duration: 1.2 + (index * 0.1),
    }))
  }

  const [albumCovers, setAlbumCovers] = useState(getInitialAlbumCovers)

  // 스케일 계산 함수 (실제 뷰포트 1440x731 기준 최적화)
  const calculateScale = () => {
    if (!isClient) return 1
    
    const width = window.innerWidth
    const height = window.innerHeight // 실제 뷰포트 높이 (브라우저 UI 제외)
    
    // 대형 데스크탑 (1920px 이상, 1000px 이상)에서만 원본 크기
    if (width >= 1920 && height >= 1000) {
      return 1
    }
    
    // 일반 데스크탑 (1700px 이상)
    if (width >= 1700 && height >= 900) {
      return 0.9 // 90% 크기
    }
    
    // 노트북 크기 감지 - 실제 뷰포트 기준 (1440x731 등)
    if (width <= 1600 || height <= 800) {
      // 헤더 높이를 제외한 사용 가능한 높이
      const availableHeight = height - 56
      
      // 실제 필요한 공간
      const requiredWidth = 1600
      const requiredHeight = 1050
      
      // 스케일 계산
      const scaleX = (width * 0.9) / requiredWidth
      const scaleY = (availableHeight * 0.9) / requiredHeight
      
      let calculatedScale = Math.min(scaleX, scaleY, 1)
      
      // 1440x731 같은 일반적인 노트북 뷰포트에서 75% 적용
      if (width <= 1600 && height <= 800) {
        calculatedScale = Math.min(calculatedScale, 0.75)
      }
      
      // 더 작은 화면에서는 더 축소
      if (width <= 1366 || height <= 700) {
        calculatedScale = Math.min(calculatedScale, 0.65)
      }
      
      return Math.max(calculatedScale, 0.35)
    }
    
    return 1
  }

  // 모든 타이머 정리 함수
  const clearAllTimers = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current)
      logoTimerRef.current = null
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }

  // 4가지 방향별 초기 위치 생성 함수
  const generateInitialPositions = (direction: string) => {
    const positions = []
    
    for (let i = 0; i < 20; i++) {
      let initialX, initialY
      const randomOffset = Math.random() * 200 + 100
      
      switch (direction) {
        case 'top-left':
          initialX = -(400 + randomOffset)
          initialY = -(150 + Math.random() * 200)
          break
        case 'top-right':
          initialX = 400 + randomOffset
          initialY = -(150 + Math.random() * 200)
          break
        case 'bottom-left':
          initialX = -(400 + randomOffset)
          initialY = 400 + Math.random() * 200
          break
        case 'bottom-right':
          initialX = 400 + randomOffset
          initialY = 400 + Math.random() * 200
          break
        default:
          initialX = -(400 + randomOffset)
          initialY = -(150 + Math.random() * 200)
      }
      
      positions.push({ initialX, initialY })
    }
    
    return positions
  }

  // 배열 셔플 함수
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // 쏟기 애니메이션 함수 (즉시 실행 버전)
  const spillPhotos = () => {
    if (!isClient) return
    
    // 이전 타이머들 모두 즉시 정리
    clearAllTimers()
    
    // 즉시 상태 리셋 (이전 애니메이션 중단)
    setMounted(false)
    setLogoVisible(false)
    
    // 새로운 랜덤 데이터 즉시 생성
    const directions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    const randomDirection = directions[Math.floor(Math.random() * directions.length)]
    const initialPositions = generateInitialPositions(randomDirection)
    const shuffledPositions = shuffleArray(positions)
    
    const newAlbumCovers = baseAlbumData.map((album, index) => ({
      ...album,
      ...shuffledPositions[index],
      ...initialPositions[index],
      delay: 0.1 + (index * 0.05) + (Math.random() * 0.1),
      duration: 1.2 + (index * 0.1) + (Math.random() * 0.3),
      rotation: album.rotation + (Math.random() * 20 - 10),
    }))
    
    setAlbumCovers(newAlbumCovers)
    setAnimationKey(prev => prev + 1)
    
    // 새로운 애니메이션 시작
    animationTimerRef.current = setTimeout(() => {
      setMounted(true)
    }, 50) // 더 빠른 시작
    
    // 로고 표시 (애니메이션과 함께)
    logoTimerRef.current = setTimeout(() => {
      setLogoVisible(true)
    }, 2000) // 조금 더 빠른 로고 등장
  }

  // ref를 통해 spillPhotos 함수 노출
  useImperativeHandle(ref, () => ({
    spillPhotos
  }))

  // 반응형 크기 계산 함수 (V35 원본 그대로)
  const getResponsiveSize = (baseSize: number) => {
    if (!isClient) return baseSize // SSR에서는 기본 크기 반환
    
    const width = window.innerWidth
    if (width >= 1440) return Math.round(baseSize * 1.2)
    if (width >= 1200) return Math.round(baseSize * 1.1)
    if (width >= 768) return baseSize
    if (width >= 640) return Math.round(baseSize * 0.8)
    return Math.round(baseSize * 0.6)
  }

  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    // 클라이언트 마운트 확인
    setIsClient(true)
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setScale(calculateScale()) // 리사이즈 시 스케일 재계산
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // 첫 번째 랜덤화 (클라이언트에서만)
    const initTimer = setTimeout(() => {
      const directions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
      const randomDirection = directions[Math.floor(Math.random() * directions.length)]
      const initialPositions = generateInitialPositions(randomDirection)
      const shuffledPositions = shuffleArray(positions)
      
      const randomizedAlbums = baseAlbumData.map((album, index) => ({
        ...album,
        ...shuffledPositions[index],
        ...initialPositions[index],
        delay: 0.1 + (index * 0.05) + (Math.random() * 0.1),
        duration: 1.2 + (index * 0.1) + (Math.random() * 0.3),
        rotation: album.rotation + (Math.random() * 20 - 10),
      }))
      
      setAlbumCovers(randomizedAlbums)
      setAnimationKey(prev => prev + 1)
    }, 100)

    // 애니메이션 시작
    const animTimer = setTimeout(() => setMounted(true), 300)
    const logoTimer = setTimeout(() => {
      setLogoVisible(true)
    }, 2800)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(initTimer)
      clearTimeout(animTimer)
      clearTimeout(logoTimer)
      clearAllTimers() // 컴포넌트 언마운트 시 모든 타이머 정리
    }
  }, [])

  return (
    <div 
      className="flex items-center justify-center text-white overflow-hidden select-none"
      style={{ 
        height: 'calc(100vh - 56px)', // 헤더 높이 제외
        width: '100%'
      }}
    >
        {/* 스케일링 컨테이너 - 메인 콘텐츠만 */}
        <div 
          className="transition-transform duration-300"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            width: '1600px',
            height: '1000px',
          }}
        >
          {/* Main Content */}
          <main className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
            {/* Vinyl Records Pile Container - V35 원본 크기 그대로 */}
            <div className="relative w-full max-w-[1600px] mx-auto h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] xl:h-[900px] 2xl:h-[950px]">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-orange-500/15 via-yellow-500/10 to-transparent blur-3xl"></div>
              <div className="absolute inset-0 bg-gradient-radial from-red-500/10 via-transparent to-transparent blur-2xl"></div>
              
              {/* Album covers pile */}
              <div className="relative w-full h-full" key={animationKey}>
                {albumCovers.map((album) => {
                  const responsiveWidth = getResponsiveSize(album.baseWidth)
                  const responsiveHeight = getResponsiveSize(album.baseHeight)
                  
                  return (
                    <div
                      key={`${album.id}-${animationKey}`}
                      className="absolute transition-all hover:scale-105 hover:z-50"
                      style={{
                        left: album.x,
                        top: album.y,
                        transform: mounted 
                          ? `rotate(${album.rotation}deg)` 
                          : `translateX(${album.initialX * (windowWidth >= 1440 ? 1.2 : 1)}px) translateY(${album.initialY}px) rotate(${album.rotation}deg)`,
                        zIndex: album.zIndex,
                        opacity: mounted ? album.opacity : 0,
                        transitionDelay: `${album.delay}s`,
                        transitionDuration: `${album.duration}s`,
                        transitionTimingFunction: album.id % 3 === 0 
                          ? 'cubic-bezier(0.15, 0.8, 0.25, 1)' 
                          : album.id % 3 === 1 
                            ? 'cubic-bezier(0.18, 0.9, 0.32, 1)' 
                            : 'cubic-bezier(0.12, 0.7, 0.28, 1)',
                      }}
                    >
                      <div 
                        className="relative shadow-2xl"
                        style={{
                          width: `${responsiveWidth}px`,
                          height: `${responsiveHeight}px`,
                        }}
                      >
                        <Image
                          src={`/dummy/main-dummy${album.id}.jpg`}
                          alt={`Main Dummy ${album.id}`}
                          width={responsiveWidth}
                          height={responsiveHeight}
                          className="w-full h-full object-cover rounded-sm shadow-lg select-none"
                          style={{
                            filter: `brightness(0.9) contrast(1.1)`,
                          }}
                          draggable={false}
                        />
                        <div 
                          className="absolute inset-0 rounded-sm"
                          style={{
                            background: `linear-gradient(${album.rotation + 45}deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Photo Keepick Logo - 정확한 중앙 정렬 */}
                <div 
                  className={`absolute transition-all duration-1200 ease-out ${
                    logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                  style={{ 
                    zIndex: 100,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Image
                    src="/images/keepick-logo.png"
                    alt="Photo Keepick Logo"
                    width={800}
                    height={600}
                    className="w-full h-auto max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] 2xl:max-w-[900px] drop-shadow-2xl select-none"
                    style={{
                      pointerEvents: 'none'
                    }}
                    draggable={false}
                    priority
                  />
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* 디버그 정보 (개발용) */}
        {isClient && (
          <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
            Scale: {Math.round(scale * 100)}% | {window.innerWidth}×{window.innerHeight}
          </div>
        )}
    </div> 
  )
})

KeepickMainLanding.displayName = 'KeepickMainLanding'

export default KeepickMainLanding