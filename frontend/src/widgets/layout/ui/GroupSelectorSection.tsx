'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, ChevronUp, UserPlus, ExternalLink } from 'lucide-react'
import { InteractiveHoverButton } from '@/shared/ui/composite/InteractiveHoverButton'
import { useQuery } from "@tanstack/react-query"
import { GroupManagementApi, groupQueryKeys } from "@/features/group-management"
import { groupListSelectors, groupFormatters } from "@/entities/group"
import type { GroupListItem } from "@/entities/group"
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import { Button } from "@/shared/ui/shadcn/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
  onInviteGroup?: (group: GroupListItem) => void
}

export function GroupSelectorSection({ 
  currentGroup, 
  showCreateGroupButton = true,
  isMounted,
  createGroupModal,
  onInviteGroup
}: GroupSelectorSectionProps) {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const { isLoggedIn } = useMainAuth()
  const router = useRouter()

  // 로그인된 상태에서만 그룹 목록 조회
  const { data: allGroups = [] } = useQuery({
    queryKey: groupQueryKeys.lists(),
    queryFn: () => GroupManagementApi.getMyGroups(),
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
          {/* 그룹명 + 초대 버튼 + 드롭다운 화살표 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#111111] rounded-lg">
            {/* 그룹 정보 */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white text-base font-medium truncate">{currentGroup.name}</span>
            </div>
            
            {/* 초대 버튼 */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onInviteGroup?.({
                groupId: parseInt(currentGroup.id),
                name: currentGroup.name,
                memberCount: 0,
                invitationStatus: "ACCEPTED" as const,
                createdAt: new Date().toISOString()
              })}
              className="w-7 h-7 border-gray-600 text-gray-300 hover:border-[#FE7A25] hover:bg-[#FE7A25]/10 hover:text-[#FE7A25] transition-all duration-300 hover:scale-105 active:scale-95"
              title="그룹원 초대"
            >
              <UserPlus size={12} />
            </Button>
            
            {/* 드롭다운 화살표 */}
            <button
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="w-7 h-7 flex items-center justify-center bg-[#111111] hover:bg-gray-700 rounded transition-all duration-200 focus:outline-none focus:ring-0 border-0"
              title="다른 그룹으로 이동"
            >
              {isGroupDropdownOpen ? (
                <ChevronUp size={14} className="text-gray-400" />
              ) : (
                <ChevronDown size={14} className="text-gray-400" />
              )}
            </button>
          </div>
          
          {/* 드롭다운 메뉴 - 다른 그룹 목록 */}
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
              {myGroups
                .filter(group => group.groupId.toString() !== currentGroup.id) // 현재 그룹 제외
                .map((group) => (
                <button
                  key={group.groupId}
                  onClick={() => {
                    router.push(`/group/${group.groupId}`)
                    setIsGroupDropdownOpen(false)
                  }}
                  className="group w-full text-left px-4 py-4 text-base hover:bg-gray-700 transition-colors text-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {groupFormatters.formatMemberCount(group.memberCount || 0)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        showCreateGroupButton && (
          <div className="flex justify-center">
            <InteractiveHoverButton
              variant="ghost"
              size="lg"
              onClick={createGroupModal.onOpen}
              className="text-lg px-8 py-4"
            >
              NEW GROUP
            </InteractiveHoverButton>
          </div>
        )
      )}
    </div>
  )
}