"use client"

import Link from "next/link"

interface SidebarProps {
  activeGroup?: string
  sidebarOpen?: boolean
  setSidebarOpen?: (open: boolean) => void
}

export default function Sidebar({ activeGroup, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const groups = [
    { id: "family", name: "가족 모임", icon: "👨‍👩‍👧‍👦", count: 5 },
    { id: "college", name: "대학 친구들", icon: "🎓", count: 5 },
    { id: "work", name: "회사 동료", icon: "💼", count: 5 },
    { id: "study", name: "스터디 그룹", icon: "📚", count: 5 },
    { id: "travel", name: "여행 동호회", icon: "✈️", count: 5 },
    { id: "hobby", name: "취미 모임", icon: "🎮", count: 5 },
  ]

  return (
    <aside className="w-64 bg-gradient-to-br from-[var(--primary-color)] to-[#28a795] text-white p-6 shadow-xl flex flex-col h-[calc(100vh-5rem)] overflow-y-auto relative">
      {/* Close Button */}
      {setSidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-black/10 p-2 rounded-lg transition-all z-10"
        >
          <span className="text-lg">✕</span>
        </button>
      )}

      <div className="flex items-center p-4 mb-8">
        <Link href="/" className="font-montserrat font-bold text-3xl text-white flex items-center">
          Keep<span className="text-white ml-1">ick</span>
        </Link>
      </div>

      <nav className="flex-1">
        <ul className="space-y-3">
          <li>
            <Link
              href="/personal"
              className="flex items-center gap-4 text-white/85 hover:text-white hover:bg-black/10 p-3 rounded-xl font-semibold transition-all"
            >
              <span className="text-xl">📊</span>
              개인 스페이스
            </Link>
          </li>
          <li>
            <Link
              href="/recommended"
              className="flex items-center gap-4 text-white/85 hover:text-white hover:bg-black/10 p-3 rounded-xl font-semibold transition-all"
            >
              <span className="text-xl">⭐</span>
              추천의 스페이스
            </Link>
          </li>
        </ul>

        <div className="text-white/70 text-sm font-semibold px-3 mt-6 mb-2 uppercase tracking-wider">내 그룹</div>

        <ul className="space-y-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/albums`}
                className={`flex items-center gap-4 p-3 rounded-xl font-semibold transition-all ${
                  activeGroup === group.id
                    ? "bg-black/15 text-white"
                    : "text-white/85 hover:text-white hover:bg-black/10"
                }`}
              >
                <span className="text-xl">{group.icon}</span>
                <span className="flex-1">{group.name}</span>
                <span className="bg-[var(--primary-color)] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {group.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
