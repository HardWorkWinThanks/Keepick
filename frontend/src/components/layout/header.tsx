"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

interface HeaderProps {
  variant?: "home" | "app"
  currentPage?: string
}

export default function Header({ variant = "home", currentPage }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (variant === "home") {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-12 py-4 bg-white shadow-lg transition-all duration-300 ${isScrolled ? "py-3 shadow-xl" : ""}`}
      >
        <Link href="/" className="font-montserrat font-bold text-3xl text-[var(--primary-color)] flex items-center">
          Keep<span className="text-[var(--text-dark)] ml-1">ick</span>
        </Link>


        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-[var(--primary-color)] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
          >
            <span className="text-lg">👥</span>
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="bg-[var(--primary-color)] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
          >
            <span className="text-lg">💬</span>
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-[var(--border-color)] rounded-xl shadow-xl min-w-48 z-50 opacity-100 transform translate-y-0 transition-all duration-300">
              <div className="p-3 hover:bg-[var(--bg-dark)] hover:text-[var(--primary-color)] cursor-pointer flex items-center gap-3 rounded-t-xl">
                🐿️ 람쥐
              </div>
              <div className="p-3 hover:bg-[var(--bg-dark)] hover:text-[var(--primary-color)] cursor-pointer flex items-center gap-3">
                🦝 너구리
              </div>
              <div className="p-3 hover:bg-[var(--bg-dark)] hover:text-[var(--primary-color)] cursor-pointer flex items-center gap-3 rounded-b-xl">
                🦔 고슴도치
              </div>
            </div>
          )}
        </div>

        {showChat && (
          <div className="fixed bottom-6 right-6 w-80 bg-white border border-[var(--border-color)] rounded-xl shadow-2xl z-50 overflow-hidden transform scale-100 opacity-100 transition-all duration-300">
            <div className="bg-[var(--primary-color)] text-white p-3 flex justify-between items-center">
              <span className="font-semibold">현재 그룹채팅</span>
              <button onClick={() => setShowChat(false)} className="text-white hover:opacity-80">
                <span className="text-lg">✕</span>
              </button>
            </div>
            <div className="p-4 max-h-56 overflow-y-auto">
              <div className="text-center text-sm bg-[#e0f2f1] text-[var(--primary-color)] rounded-full py-2 px-4 mb-3">
                🎥 영상채팅 참여중...
              </div>
              <div className="bg-[var(--bg-dark)] rounded-2xl p-3 mb-3 max-w-[80%]">🐿️ 람쥐: 안녕!</div>
              <div className="bg-[var(--bg-dark)] rounded-2xl p-3 mb-3 max-w-[80%]">🦝 너구리: 시작하자!</div>
            </div>
          </div>
        )}
      </header>
    )
  }

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-lg mb-6">
      <div className="font-montserrat text-3xl font-bold text-[var(--primary-color)]">Keepick</div>
      <nav className="flex gap-6">
        <Link
          href="/"
          className={`text-[var(--text-dark)] font-semibold px-3 py-2 rounded-lg transition-all ${currentPage === "home" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--primary-color)] hover:text-white"}`}
        >
          홈
        </Link>
        <Link
          href="/albums"
          className={`text-[var(--text-dark)] font-semibold px-3 py-2 rounded-lg transition-all ${currentPage === "albums" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--primary-color)] hover:text-white"}`}
        >
          그룹스페이스
        </Link>
        <Link
          href="/chat"
          className={`text-[var(--text-dark)] font-semibold px-3 py-2 rounded-lg transition-all ${currentPage === "chat" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--primary-color)] hover:text-white"}`}
        >
          그룹 채팅
        </Link>
        <Link
          href="/friends"
          className={`text-[var(--text-dark)] font-semibold px-3 py-2 rounded-lg transition-all ${currentPage === "friends" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--primary-color)] hover:text-white"}`}
        >
          친구
        </Link>
        <Link
          href="/photos"
          className={`text-[var(--text-dark)] font-semibold px-3 py-2 rounded-lg transition-all ${currentPage === "photos" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--primary-color)] hover:text-white"}`}
        >
          사진 관리
        </Link>
      </nav>
    </div>
  )
}
