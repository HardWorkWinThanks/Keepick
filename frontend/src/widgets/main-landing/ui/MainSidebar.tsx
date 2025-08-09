'use client'

import { useState } from "react"
import { ChevronRight, ChevronDown } from 'lucide-react'
import FriendsTabWidget from "./FriendsTabWidget"
import { useMainGroups } from "@/features/main-integration/model/useMainGroups"

interface MainSidebarProps {
  sidebarHovered: boolean
  sidebarPinned: boolean
  setSidebarHovered: (hovered: boolean) => void
  toggleSidebarPin: () => void
}

export default function MainSidebar({
  sidebarHovered,
  sidebarPinned,
  setSidebarHovered,
  toggleSidebarPin
}: MainSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([])
  const { groups, navigateToGroup } = useMainGroups()

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const shouldShowSidebar = sidebarHovered || sidebarPinned

  return (
    <>
      {/* Left Edge Hover Zone - 화면 왼쪽 가장자리 */}
      <div 
        className="fixed left-0 top-0 z-30"
        style={{
          width: '20px',
          height: '100vh',
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
    </>
  )
}