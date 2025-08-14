"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { useMainAuth } from "@/features/main-integration/model/useMainAuth";
import { SocialLoginButton } from "@/features/auth";
import { handleSocialLogin } from "@/features/auth/model/handleSocialLogin";
import { useLogout } from "@/features/auth/model/useLogout";

interface AppHeaderProps {
  sidebarPinned: boolean;
  onSpillPhotos?: () => void;
  showLogo?: boolean;
  logoText?: string;
  showCenterButton?: boolean;
  centerButtonText?: string;
  centerButtonTitle?: string;
}

export default function AppHeader({
  sidebarPinned,
  onSpillPhotos,
  showLogo = true,
  logoText = "Keepick",
  showCenterButton = false,
  centerButtonText = "!!!",
  centerButtonTitle = "사진 쏟기",
}: AppHeaderProps) {
  const { isLoggedIn, user } = useMainAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const logout = useLogout();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <header
      className={`flex items-center px-4 py-2 sm:px-6 sm:py-2 lg:px-12 h-14 transition-all duration-300`}
      style={{ backgroundColor: "#111111" }}
    >
      {/* Left side - 로고 */}
      {showLogo && (
        <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-200">
          <h1 className="text-sm sm:text-lg font-semibold tracking-wider cursor-pointer text-white">
            {logoText}
          </h1>
        </Link>
      )}

      {/* Center Button - 조건부 표시 */}
      {showCenterButton && onSpillPhotos && (
        <div 
          className="absolute transform -translate-x-1/2 transition-all duration-300"
          style={{
            left: sidebarPinned ? 'calc(50% + 120px)' : '50%' // 사이드바 열림에 따라 중앙 조정 (사이드바 너비 240px의 절반)
          }}
        >
          <button
            onClick={onSpillPhotos}
            className="text-2xl sm:text-3xl font-bold transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer select-none"
            style={{
              color: "#FE7A25",
              filter: "brightness(1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
            }}
            title={centerButtonTitle}
          >
            {centerButtonText}
          </button>
        </div>
      )}

      {/* Right Navigation - 로그인 상태에 따라 다른 UI */}
      <nav className="flex gap-3 sm:gap-6 items-center text-xs sm:text-sm text-gray-300 ml-auto">
        {!isLoggedIn ? (
          // 비로그인 상태
          <SocialLoginButton
            size="sm"
            className="transition-colors"
            onGoogleLogin={() => handleSocialLogin("google")}
            onKakaoLogin={() => handleSocialLogin("kakao")}
            onNaverLogin={() => handleSocialLogin("naver")}
          />
        ) : (
          // 로그인 상태
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="hover:scale-105 transition-transform duration-200"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                {user?.name?.charAt(0) || "K"}
              </div>
            </button>

            {/* 프로필 드롭다운 메뉴 - 절대 위치로 고정 */}
            {isProfileMenuOpen && (
              <div
                className="absolute top-full right-0 mt-1 z-50 animate-in fade-in-0 zoom-in-95 duration-200"
                style={{
                  minWidth: "160px",
                  maxWidth: "200px",
                }}
              >
                <div
                  className="rounded-lg shadow-lg border border-gray-700"
                  style={{ backgroundColor: "#222222" }}
                >
                  {/* 닉네임 섹션 */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || "Keepick User"}
                    </p>
                  </div>

                  {/* 메뉴 아이템들 */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm text-gray-300 flex items-center gap-2 no-underline"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User size={14} className="text-gray-400" />
                      프로필 페이지
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-900/30 transition-colors text-sm text-red-400 hover:text-red-300 flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <LogOut size={14} className="text-red-400" />
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}