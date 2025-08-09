'use client'

import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import SocialLoginButton from "./SocialLoginButton"
import { handleSocialLogin } from "@/features/auth/model/handleSocialLogin"

interface MainHeaderProps {
  sidebarPinned: boolean
  onSpillPhotos: () => void
}

export default function MainHeader({ sidebarPinned, onSpillPhotos }: MainHeaderProps) {
  const { isLoggedIn, user } = useMainAuth()

  return (
    <header 
      className={`fixed top-0 right-0 z-50 flex items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-12 h-20 transition-all duration-300 ${
        sidebarPinned ? 'left-[240px]' : 'left-0'
      }`} 
      style={{ backgroundColor: '#111111' }}
    >
      {/* Left side - 로고만 */}
      <div className="flex items-center">
        <h1 className="text-sm sm:text-lg font-semibold tracking-wider">Keepick</h1>
      </div>
      
      {/* Center Spill Button - 절대 위치로 중앙 고정 */}
      <button 
        onClick={onSpillPhotos}
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl sm:text-3xl font-bold transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer select-none"
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
      <nav className="flex gap-3 sm:gap-6 items-center text-xs sm:text-sm text-gray-300 ml-auto">
        {!isLoggedIn ? (
          // 비로그인 상태
          <SocialLoginButton 
            size="sm"
            className="transition-colors"
            onGoogleLogin={() => handleSocialLogin('google')}
            onKakaoLogin={() => handleSocialLogin('kakao')}
            onNaverLogin={() => handleSocialLogin('naver')}
          />
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
  )
}