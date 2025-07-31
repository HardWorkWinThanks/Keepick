// components/layout/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  // 실제로는 인증 상태에서 가져올 데이터
  const user = { name: "wmwogus", imageUrl: "/jaewan1.jpg" }; // [변경] 프로필 사진 경로 수정

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm shadow-sm h-16">
      {" "}
      {/* 높이 고정 */}
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {onMenuClick ? (
            <button
              onClick={onMenuClick}
              className="text-gray-600 hover:text-[var(--primary-color)]"
            >
              <span className="sr-only">메뉴 열기</span>
              <Bars3Icon className="h-7 w-7" />
            </button>
          ) : (
            <div className="w-7 h-7"></div>
          )}
          <Link
            href="/"
            className="font-montserrat font-bold text-2xl text-[var(--primary-color)]"
          >
            Keep<span className="text-[var(--text-dark)] ml-1">ick</span>
          </Link>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-4">
          <button className="relative text-gray-600 hover:text-[var(--primary-color)] p-2 rounded-full hover:bg-gray-100">
            <span className="sr-only">알림</span>
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
          </button>

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
                  <p className="font-bold text-sm text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">반갑습니다!</p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <UserCircleIcon className="w-5 h-5" /> 프로필
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" /> 로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
