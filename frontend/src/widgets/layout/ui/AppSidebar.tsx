'use client'

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Settings, Check, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
// import { FriendsTabWidget } from "@/widgets/friends" // 친구 기능 제거
import { GroupChatVideoSection } from "./GroupChatVideoSection"
import { GroupSelectorSection } from "./GroupSelectorSection"
import { GroupInfoSection } from "./GroupInfoSection"
import { useMainGroups } from "@/features/main-integration/model/useMainGroups"
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { Button } from "@/shared/ui/shadcn/button"
import { useGroupManagement, CreateGroupModal, LeaveGroupModal, GroupManagementApi, groupQueryKeys } from "@/features/group-management"
import { useQuery } from "@tanstack/react-query"
import { groupListSelectors, groupFormatters } from "@/entities/group"
import type { GroupListItem } from "@/entities/group"
import { useModal } from "@/shared/ui/modal/Modal"

interface AppSidebarProps {
  sidebarHovered: boolean
  sidebarPinned: boolean
  setSidebarHovered: (hovered: boolean) => void
  toggleSidebarPin: () => void
  showCreateGroupButton?: boolean
  showGroupsSection?: boolean
  showFriendsSection?: boolean
  currentGroup?: {
    id: string
    name: string
    description: string
    thumbnailUrl?: string
  }
  forceInitialPinned?: boolean
  
  // 그룹챗 관련 (새로 추가)
  showGroupChat?: boolean
  groupChatProps?: {
    isInCall?: boolean
    participants?: any[] // TODO: 실제 타입으로 교체
  }
  
  // 페이지별 동적 컨텐츠 (새로 추가)
  dynamicContent?: React.ReactNode
}

export default function AppSidebar({
  sidebarHovered,
  sidebarPinned,
  setSidebarHovered,
  toggleSidebarPin,
  showCreateGroupButton = true,
  showGroupsSection = true,
  showFriendsSection = true,
  currentGroup,
  forceInitialPinned = false,
  showGroupChat = false,
  groupChatProps = {},
  dynamicContent
}: AppSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([])
  const [groupsSectionExpanded, setGroupsSectionExpanded] = useState(true)
  // const [friendsSectionExpanded, setFriendsSectionExpanded] = useState(false) // 친구 기능 제거
  const [groupMembersExpanded, setGroupMembersExpanded] = useState(true) // 그룹원 드롭다운 항상 열림
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const [leaveGroupTarget, setLeaveGroupTarget] = useState<GroupListItem | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const createGroupModal = useModal()
  const leaveGroupModal = useModal()
  const { groups, navigateToGroup, isGroupsLoading: mainGroupsLoading } = useMainGroups()
  const { isLoggedIn } = useMainAuth()
  const { updateGroup, useGroupMembers } = useGroupManagement()
  const [isMounted, setIsMounted] = useState(false)
  // Hydration 완료 후에만 인증 상태 기반 렌더링 적용
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // 로그인된 상태에서만 그룹 목록 조회 - enabled 옵션 추가
  const { data: allGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: groupQueryKeys.lists(),
    queryFn: GroupManagementApi.getMyGroups,
    enabled: isMounted && isLoggedIn, // Hydration 완료 후 로그인된 상태에서만 실행
    staleTime: 1 * 60 * 1000, // 1분으로 단축 (더 자주 업데이트)
    gcTime: 5 * 60 * 1000, // 5분 가비지 컬렉션
    refetchOnWindowFocus: true, // 윈도우 포커스 시 자동 리패치
    refetchOnReconnect: true, // 네트워크 재연결 시 자동 리패치
  })
  
  // entities 셀렉터를 사용해서 수락된 그룹만 필터링하고 정렬
  const myGroups = isMounted && isLoggedIn ? groupListSelectors.sortByName(
    groupListSelectors.getAcceptedGroups(allGroups)
  ) : []

  // 현재 그룹의 멤버 목록 조회
  const { data: groupMembers = [], isLoading: isLoadingMembers } = useGroupMembers(
    currentGroup ? parseInt(currentGroup.id) : 0
  )

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const toggleGroupsSection = () => {
    setGroupsSectionExpanded(prev => !prev)
  }

  // const toggleFriendsSection = () => {
  //   setFriendsSectionExpanded(prev => !prev)
  // } // 친구 기능 제거

  const toggleGroupMembersSection = () => {
    setGroupMembersExpanded(!groupMembersExpanded)
  }


  const shouldShowSidebar = sidebarHovered || sidebarPinned

  // 로그인하지 않은 경우 사이드바 숨김
  if (!isMounted || !isLoggedIn) {
    return null
  }

  return (
    <>
      {/* 사이드바가 숨겨졌을 때 보이는 토글 버튼 */}
      {!shouldShowSidebar && (
        <Button
          onClick={toggleSidebarPin}
          variant="ghost" 
          size="icon"
          className="fixed top-16 left-4 z-50 transition-all duration-300 hover:bg-white/10 border-0 text-white hover:text-white"
          style={{ zIndex: 60 }}
          title="사이드바 열기"
        >
          <Menu size={20} />
        </Button>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed left-0 z-40 transition-all ease-in-out ${
          shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          backgroundColor: '#111111',
          width: '240px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          top: sidebarPinned ? '0' : '140px',
          height: sidebarPinned ? '100vh' : 'calc(100vh - 140px)',
          transitionDuration: shouldShowSidebar ? '0.4s' : '0.3s', // 나타날 때 더 느리게
          transitionDelay: sidebarPinned ? '0s' : (shouldShowSidebar ? '0.1s' : '0s'), // 나타날 때 약간의 지연
        }}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <ScrollArea className="h-full">
          <div className="pb-4">
            {/* 사이드바 토글 버튼 - 사이드바 내부 상단 */}
            <div className="p-4 border-b border-gray-800">
              <Button
                onClick={toggleSidebarPin}
                variant="ghost" 
                size="sm"
                className="w-full justify-start gap-2 hover:bg-gray-800 text-gray-400 hover:text-white"
                title="사이드바 숨기기"
              >
                <motion.div
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <X size={16} />
                </motion.div>
                <span className="text-sm">사이드바 닫기</span>
              </Button>
            </div>

            {/* 상단 구역: 그룹챗 (고정) */}
            {showGroupChat && currentGroup && (
              <GroupChatVideoSection
                isInCall={groupChatProps.isInCall}
                participants={groupChatProps.participants}
              />
            )}
            
            {/* 하단 구역: 동적 컨텐츠 */}
            <div className="flex-1">
          {/* Group Selector - 그룹 스페이스에서는 그룹 선택 드롭다운 */}
          {shouldShowSidebar && showCreateGroupButton && (
            <div 
              className={`p-4 border-b border-gray-800 transition-all duration-300 ${
                sidebarPinned ? 'opacity-100' : 'opacity-90'
              } ${
                !sidebarPinned ? 'border-t border-gray-800' : ''
              }`}
            >
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
                <button 
                  onClick={createGroupModal.onOpen}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95"
                >
                  + 새 그룹 만들기
                </button>
              )}
            </div>
          )}

          {/* Current Group Details - 제거됨 (이제 dynamicContent로 사용) */}

          {/* Groups List */}
          {!currentGroup && showGroupsSection && (
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400">그룹</h3>
                <button
                  onClick={toggleGroupsSection}
                  className="p-1 rounded hover:bg-gray-800 transition-all duration-200 mr-3"
                >
                  {groupsSectionExpanded ? (
                    <ChevronDown size={16} className="text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
                  )}
                </button>
              </div>
              <div className={`transition-all duration-200 ease-in-out ${
                groupsSectionExpanded 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                {isGroupsLoading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    그룹 목록을 불러오는 중...
                  </div>
                ) : myGroups.length > 0 ? (
                  <div className="space-y-1">
                    {myGroups.map((group) => (
                      <div key={group.groupId} className="space-y-1">
                        {/* Group Item */}
                        <div className="flex items-center justify-between group">
                          <button 
                            className="flex-1 text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm cursor-pointer text-white"
                            onClick={() => {
                              // 그룹 ID로 직접 이동
                              window.location.href = `/group/${group.groupId}`
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {group.thumbnailUrl && (
                                <div className="w-4 h-4 relative rounded-full overflow-hidden">
                                  <Image
                                    src={group.thumbnailUrl || "/placeholder/photo-placeholder.svg"}
                                    alt={`${group.name} 썸네일`}
                                    fill
                                    sizes="16px"
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <span>{group.name}</span>
                            </div>
                          </button>
                          <button
                            onClick={() => toggleGroup(group.groupId)}
                            className="p-1 rounded hover:bg-gray-800 transition-all duration-200"
                          >
                            <motion.div
                              animate={{ 
                                rotate: expandedGroups.includes(group.groupId) ? 90 : 0 
                              }}
                              transition={{ 
                                duration: 0.3, 
                                ease: [0.32, 0.72, 0, 1] 
                              }}
                            >
                              <ChevronRight size={16} className="text-gray-400" />
                            </motion.div>
                          </button>
                        </div>

                        {/* Dropdown Content */}
                        <AnimatePresence>
                          {expandedGroups.includes(group.groupId) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: [0.32, 0.72, 0, 1], // 부드러운 이징
                                opacity: { duration: 0.25 }
                              }}
                              className="ml-4 pl-3 border-l border-gray-700 overflow-hidden"
                            >
                              <motion.div 
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{
                                  duration: 0.25,
                                  delay: 0.1,
                                  ease: [0.32, 0.72, 0, 1]
                                }}
                                className="space-y-1 py-2"
                              >
                                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300">
                                  그룹 초대
                                </button>
                                <button 
                                  onClick={() => {
                                    setLeaveGroupTarget(group)
                                    leaveGroupModal.onOpen()
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-900/50 transition-colors text-sm text-red-400 hover:text-red-300"
                                >
                                  그룹 탈퇴
                                </button>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    가입된 그룹이 없습니다
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Friends Section - 제거됨, 프로필 페이지로 이동 */}
          {/*
          {showFriendsSection && (
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400">친구</h3>
                <button
                  onClick={toggleFriendsSection}
                  className="p-1 rounded hover:bg-gray-800 transition-all duration-200 mr-3"
                >
                  {friendsSectionExpanded ? (
                    <ChevronDown size={16} className="text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
                  )}
                </button>
              </div>
              <div className={`transition-all duration-200 ease-in-out ${
                friendsSectionExpanded 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                <div className="h-[calc(100%-2rem)]">
                  <FriendsTabWidget />
                </div>
              </div>
            </div>
          )}
          */}
          
          {/* 동적 컨텐츠 영역 - 페이지별로 다른 기능들 */}
          {dynamicContent}
          
        </div>
      </div>
    </ScrollArea>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={createGroupModal.isOpen}
        onClose={createGroupModal.onClose}
      />
      
      {/* Leave Group Modal */}
      {leaveGroupTarget && (
        <LeaveGroupModal 
          isOpen={leaveGroupModal.isOpen}
          onClose={() => {
            leaveGroupModal.onClose()
            setLeaveGroupTarget(null)
          }}
          group={leaveGroupTarget}
        />
      )}
    </>
  )
}