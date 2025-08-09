'use client'

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import MainHeader from "./MainHeader"
import MainSidebar from "./MainSidebar"

export default function KeepickMainLanding() {
  const [mounted, setMounted] = useState(false)
  const [logoVisible, setLogoVisible] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [scale, setScale] = useState(1)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)

  // 타이머 참조들
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 햄버거 버튼 토글
  const toggleSidebarPin = () => {
    setSidebarPinned(!sidebarPinned)
    if (sidebarPinned) {
      setSidebarHovered(false) // 고정 해제 시 즉시 호버 상태 해제
    }
  }

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
      const availableHeight = height - 80
      
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
  const shuffleArray = (array: any[]) => {
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
    <div className="min-h-screen text-white overflow-hidden select-none" style={{ backgroundColor: '#111111' }}>
      {/* Sidebar */}
      <MainSidebar 
        sidebarHovered={sidebarHovered}
        sidebarPinned={sidebarPinned}
        setSidebarHovered={setSidebarHovered}
        toggleSidebarPin={toggleSidebarPin}
      />

      {/* Header */}
      <MainHeader 
        sidebarPinned={sidebarPinned}
        onSpillPhotos={spillPhotos}
      />

      {/* Main Content Container - 기존 위치부터 */}
      <div 
        className="fixed left-0 top-0 z-30"
        style={{
          width: '20px', // 얇은 감지 영역
          height: '100vh', // 전체 높이
        }}
        onMouseEnter={() => setSidebarHovered(true)}
      />

      {/* Hamburger Button Area Hover Zone */}
      <div 
        className="fixed left-0 top-20 z-30"
        style={{
          width: '80px',
          height: '80px',
        }}
        onMouseEnter={() => setSidebarHovered(true)}
      />

      {/* Sidebar */}
      <div 
        className={`fixed left-0 z-40 transition-transform duration-300 ease-in-out ${
          shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          backgroundColor: '#111111',
          width: '240px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          top: sidebarPinned ? '0' : '140px',
          height: sidebarPinned ? '100vh' : 'calc(100vh - 140px)',
        }}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Sidebar Header - pinned 상태일 때만 표시 */}
        {sidebarPinned && (
          <div className="p-4 border-b border-gray-800">
            <button className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium">
              + 새 그룹 만들기
            </button>
          </div>
        )}

        {/* Groups List */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-3">그룹</h3>
          <div className="space-y-1">
            {groups.map((group) => (
              <div key={group.id} className="space-y-1">
                {/* Group Item */}
                <div className="flex items-center justify-between group">
                  <button 
                    className="flex-1 text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    onClick={() => navigateToGroup(group.name)}
                  >
                    {group.name}
                  </button>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="p-1 rounded hover:bg-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    {expandedGroups.includes(group.id) ? (
                      <ChevronDown size={16} className="text-gray-400 transition-transform duration-200" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
                    )}
                  </button>
                </div>

                {/* Dropdown Content */}
                <div className={`ml-4 pl-3 border-l border-gray-700 transition-all duration-200 ease-in-out ${
                  expandedGroups.includes(group.id) 
                    ? 'max-h-24 opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="space-y-1">
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300">
                      그룹 초대
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-900/50 transition-colors text-sm text-red-400 hover:text-red-300">
                      그룹 탈퇴
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Friends Section - 새로운 탭 컴포넌트 */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">친구</h3>
          <div className="h-[calc(100%-2rem)]">
            <FriendsTabWidget />
          </div>
        </div>
      </div>

      {/* Header - 항상 고정 위치, 원본 크기 */}
      <header 
        className={`fixed top-0 right-0 z-50 flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-12 h-20 transition-all duration-300 ${
          sidebarPinned ? 'left-[240px]' : 'left-0'
        }`} 
        style={{ backgroundColor: '#111111' }}
      >
        {/* Left side - 로고만 */}
        <div className="flex items-center">
          <h1 className="text-sm sm:text-lg font-semibold tracking-wider">Keepick</h1>
        </div>
        
        {/* Center Spill Button */}
        <button 
          onClick={spillPhotos}
          className="text-2xl sm:text-3xl font-bold transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer select-none"
          style={{ 
            color: '#FE7A25',
            filter: 'brightness(1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)'
          }}
          title="사진 쏟기"
        >
          !!!
        </button>
        
        {/* Right Navigation - 로그인 상태에 따라 다른 UI */}
        <nav className="flex gap-3 sm:gap-6 items-center text-xs sm:text-sm text-gray-300">
          {!isLoggedIn ? (
            // 비로그인 상태
            <button 
              onClick={handleLogin}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Login
            </button>
          ) : (
            // 로그인 상태
            <>
              <button 
                className="hover:text-white transition-colors text-lg sm:text-xl"
                title="친구 관리"
              >
                👥
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold cursor-pointer hover:scale-105 transition-transform"
                  title="프로필"
                >
                  {user?.name?.charAt(0) || 'K'}
                </div>
                <span className="text-xs sm:text-sm hover:text-white transition-colors cursor-pointer">
                  {user?.name || 'Keepick User'}
                </span>
              </div>
            </>
          )}
        </nav>
      </header>

      {/* Sidebar Toggle Button - 로고 아래 위치 */}
      <div 
        onClick={toggleSidebarPin}
        className={`fixed top-24 z-50 cursor-pointer transition-all duration-300 hover:scale-110 ${
          sidebarPinned ? 'left-[254px]' : 'left-6'
        }`}
        style={{ zIndex: 60 }}
        title="사이드바 고정/해제"
      >
        <span className="text-2xl">☰</span>
      </div>

      {/* Main Content Container - 헤더 아래 중앙 정렬 */}
      <div 
        className={`flex items-center justify-center transition-all duration-300 ${
          sidebarPinned ? 'ml-[240px]' : 'ml-0'
        }`}
        style={{ 
          height: '100vh',
          paddingTop: '80px' // 헤더 높이만큼 패딩
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
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
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
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
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
      </div>

      {/* 디버그 정보 (개발용) */}
      {isClient && (
        <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
          Scale: {Math.round(scale * 100)}% | {window.innerWidth}×{window.innerHeight}
        </div>
      )}
    </div>
  )
}