'use client'

import { useState } from "react"
import Link from "next/link"
import { User, LogOut } from 'lucide-react'
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import SocialLoginButton from "./SocialLoginButton"
import { handleSocialLogin } from "@/features/auth/model/handleSocialLogin"
import { useLogout } from "@/features/auth/model/useLogout"

interface MainHeaderProps {
  sidebarPinned: boolean
  onSpillPhotos: () => void
}

export default function MainHeader({ sidebarPinned, onSpillPhotos }: MainHeaderProps) {
  const { isLoggedIn, user } = useMainAuth()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const logout = useLogout()

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
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="hover:scale-105 transition-transform duration-200"
            >
              <div 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
              >
                {user?.name?.charAt(0) || 'K'}
              </div>
            </button>

            {/* 프로필 드롭다운 메뉴 - 절대 위치로 고정 */}
            <div className={`absolute top-full right-0 mt-1 transition-all duration-200 ease-in-out ${
              isProfileMenuOpen 
                ? 'max-h-36 opacity-100' 
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              <div className="space-y-1 min-w-[140px]">
                {/* 닉네임 섹션 */}
                <div className="px-3 py-3 border-b border-gray-700 mb-1">
                  <p className="text-base font-semibold text-white">
                    {user?.name || 'Keepick User'}
                  </p>
                </div>
                
                <Link
                  href="/profile"
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300 block flex items-center gap-2"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <User size={14} className="text-gray-400" />
                  프로필 페이지
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setIsProfileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-900/50 transition-colors text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                >
                  <LogOut size={14} className="text-red-400" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}