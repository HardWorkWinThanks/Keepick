'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useQuery } from "@tanstack/react-query"
import { GroupManagementApi, groupQueryKeys } from "@/features/group-management"
import { groupListSelectors, groupFormatters } from "@/entities/group"
import type { GroupListItem } from "@/entities/group"
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"

interface GroupSelectorSectionProps {
  currentGroup?: {
    id: string
    name: string
    description: string
    thumbnailUrl?: string
  }
  showCreateGroupButton?: boolean
  isMounted: boolean
  createGroupModal: {
    onOpen: () => void
  }
}

export function GroupSelectorSection({ 
  currentGroup, 
  showCreateGroupButton = true,
  isMounted,
  createGroupModal
}: GroupSelectorSectionProps) {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const { isLoggedIn } = useMainAuth()

  // 로그인된 상태에서만 그룹 목록 조회
  const { data: allGroups = [] } = useQuery({
    queryKey: groupQueryKeys.lists(),
    queryFn: GroupManagementApi.getMyGroups,
    enabled: isMounted && isLoggedIn,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
  
  // entities 셀렉터를 사용해서 수락된 그룹만 필터링하고 정렬
  const myGroups = isMounted && isLoggedIn ? groupListSelectors.sortByName(
    groupListSelectors.getAcceptedGroups(allGroups)
  ) : []

  return (
    <div className="p-4 border-b border-gray-800">
      {currentGroup ? (
        <div className="relative">
          <button 
            onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-between"
          >
            <span>{currentGroup.name}</span>
            {isGroupDropdownOpen ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )}
          </button>
          
          {isGroupDropdownOpen && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb {
                  background: rgba(156, 163, 175, 0.3);
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: rgba(156, 163, 175, 0.5);
                }
              `}</style>
              {myGroups.map((group) => (
                <button
                  key={group.groupId}
                  onClick={() => {
                    // 그룹 ID로 직접 이동
                    window.location.href = `/group/${group.groupId}`
                    setIsGroupDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    currentGroup?.id === group.groupId.toString() 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{group.name}</span>
                    <span className="text-xs text-gray-500">
                      {groupFormatters.formatMemberCount(group.memberCount || 0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        showCreateGroupButton && (
          <button 
            onClick={createGroupModal.onOpen}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95"
          >
            + 새 그룹 만들기
          </button>
        )
      )}
    </div>
  )
}