// components/layout/GroupSidebar.tsx
"use client";

import Link from "next/link";
import {
  PlusIcon,
  BookOpenIcon,
  StarIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface GroupSidebarProps {
  groupName: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function GroupSidebar({
  groupName,
  sidebarOpen,
  setSidebarOpen,
}: GroupSidebarProps) {
  // 실제로는 API를 통해 해당 그룹의 앨범 목록을 가져옵니다.
  const albums = [
    { id: "airport-trip", name: "김포공항에서 출발", type: "timeline" },
    { id: "best-moments", name: "제주도 제일 재밌었던 곳 뽑기!", type: "tier" },
    { id: "jeju-travel", name: "제주도 여행", type: "timeline" },
    { id: "ssafy-memories", name: "싸피에서의 추억", type: "tier" },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case "timeline":
        return <BookOpenIcon className="w-5 h-5" />;
      case "tier":
        return <TrophyIcon className="w-5 h-5" />;
      case "highlight":
        return <StarIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* [변경] Sidebar 위치 및 스타일 */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-full bg-gradient-to-br from-gray-800 to-gray-900 text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 헤더 높이(h-16)만큼의 공간 + 그룹 정보 */}
        <div className="h-16 flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-sm text-gray-400">현재 그룹</p>
            <h2 className="text-lg font-bold text-white truncate">
              {groupName}
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/80 hover:text-white lg:hidden"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            href={`/group/${groupName}/new-album`}
            className="flex items-center justify-center gap-2 w-full mb-6 px-4 py-2.5 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-400 transition-all"
          >
            <PlusIcon className="w-5 h-5" />새 앨범 만들기
          </Link>

          <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider px-2">
            앨범 목록
          </span>
          <ul className="space-y-1 mt-2">
            {albums.map((album) => (
              <li key={album.id}>
                <Link
                  href={`#${album.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="text-gray-400">
                    {getIconForType(album.type)}
                  </span>
                  <span className="flex-1 truncate text-sm">{album.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="text-sm text-gray-300 hover:text-white font-semibold"
          >
            ← 메인 대시보드로
          </Link>
        </div>
      </aside>
    </>
  );
}
