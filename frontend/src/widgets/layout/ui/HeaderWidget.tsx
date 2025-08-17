"use client";

import { useState } from "react";
import { useLogout } from "@/features/auth/model/useLogout";
import { getProfilePlaceholder } from "@/shared/constants/placeholders";

import Link from "next/link";
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftStartOnRectangleIcon, // [추가] 대시보드 이동 아이콘
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useAppSelector } from "@/shared/config";

interface HeaderProps {
  onMenuClick?: () => void;
  onBackToDashboard?: () => void; // [추가] 대시보드로 돌아가기 함수 prop
}

export default function HeaderWidget({
  onMenuClick,
  onBackToDashboard,
}: HeaderProps) {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const { currentUser, isLoading: userLoading } = useAppSelector(
    (state) => state.user
  );
  const { isAuthenticated, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );

  // 로딩 중이거나 인증된 상태면 로그인 버튼을 숨김
  const shouldShowLoginButton =
    !isAuthenticated && !userLoading && !authLoading;
  const shouldShowProfile = currentUser; // 실제 사용자 정보가 있을 때만

  const logout = useLogout();

  const user = {
    name: currentUser?.nickname || "사용자", // Guest → 사용자로 변경
    imageUrl: getProfilePlaceholder(currentUser?.profileUrl),
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm shadow-sm h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* 사이드바 메뉴 버튼 (onMenuClick prop이 있을 때만 렌더링) */}
          {onMenuClick ? (
            <button
              onClick={onMenuClick}
              className="text-gray-600 hover:text-[var(--primary-color)]"
            >
              <span className="sr-only">메뉴 열기</span>
              <Bars3Icon className="h-7 w-7" />
            </button>
          ) : (
            // 메뉴 버튼이 없을 때도 레이아웃 유지를 위한 빈 공간
            <div className="w-7 h-7"></div>
          )}

          {/* 로고 */}
          <Link
            href="/"
            className="font-montserrat font-bold text-2xl text-[var(--primary-color)]"
          >
            Keep<span className="text-[var(--text-dark)] ml-1">ick</span>
          </Link>

          {/* [추가] 대시보드 복귀 버튼 (onBackToDashboard prop이 있을 때만 렌더링) */}
          {onBackToDashboard && (
            <>
              <div className="h-6 w-px bg-gray-200"></div> {/* 시각적 구분선 */}
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-2 text-gray-600 hover:text-[var(--primary-color)] transition-colors"
              >
                <ArrowLeftStartOnRectangleIcon className="h-6 w-6" />
                <span className="font-semibold hidden sm:block">대시보드</span>
              </button>
            </>
          )}
        </div>

        {/* Right side: Actions - 항상 같은 구조 유지 */}
        <div className="flex items-center gap-4">
          <Link
            href="/friends"
            className="relative text-gray-600 hover:text-[var(--primary-color)] p-2 rounded-full hover:bg-gray-100
  transition-colors"
          >
            <span className="sr-only">친구 관리</span>
            <UserGroupIcon className="h-6 w-6" />
          </Link>

          {/* 조건에 관계없이 div 구조는 항상 유지 */}
          <div className="flex items-center">
            {shouldShowProfile && (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-gray-100 transition-colors"
                >
                  <Image
                    src={user.imageUrl}
                    alt="프로필 사진"
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8 object-cover"
                    quality={90}
                  />
                  <span className="font-semibold text-sm text-gray-800 hidden sm:block">
                    {user.name}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border"
                    onMouseLeave={() => setProfileMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b mb-2">
                      <p className="font-bold text-sm text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">반갑습니다!</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserCircleIcon className="w-5 h-5" /> 프로필
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}

            {shouldShowLoginButton && (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <span>로그인</span>
              </Link>
            )}

            {/* 로딩 중일 때도 동일한 div 구조 */}
            {!shouldShowProfile && !shouldShowLoginButton && (
              <div className="w-20 h-10"></div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
