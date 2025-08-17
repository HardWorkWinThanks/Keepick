'use client'

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Settings, Check, PanelLeft, PanelRight, ExternalLink } from 'lucide-react'
import { InteractiveHoverButton } from '@/shared/ui/composite/InteractiveHoverButton'
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
import { ReceivedInvitationsSection } from "@/features/group-invitation-response"
import { GroupInviteModal } from "@/features/group-invite"

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
  // const [friendsSectionExpanded, setFriendsSectionExpanded] = useState(false) // 친구 기능 제거
  const [expandedGroups, setExpandedGroups] = useState<number[]>([])
  const [groupsSectionExpanded, setGroupsSectionExpanded] = useState(true)
  const [groupMembersExpanded, setGroupMembersExpanded] = useState(true) // 그룹원 드롭다운 항상 열림
  const [leaveGroupTarget, setLeaveGroupTarget] = useState<GroupListItem | null>(null)
  const [inviteGroupTarget, setInviteGroupTarget] = useState<GroupListItem | null>(null)
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
  
  // 로그인된 상태에서만 그룹 목록 조회 - 성능 최적화
  const { data: allGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: groupQueryKeys.lists(),
    queryFn: () => GroupManagementApi.getMyGroups(),
    enabled: isMounted && isLoggedIn, // Hydration 완료 후 로그인된 상태에서만 실행
    staleTime: 3 * 60 * 1000, // 3분 캐시 (적당한 신선도 유지)
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리패치 비활성화
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
      {/* 사이드바 토글 버튼 - 사이드바 상태에 따라 위치 변경 */}
      <Button
        onClick={toggleSidebarPin}
        variant="ghost" 
        size="icon"
        className="fixed top-16 transition-all duration-300 border-0 text-white hover:text-white group"
        style={{ 
          zIndex: 70,
          left: shouldShowSidebar ? '256px' : '16px' // 240px(사이드바) + 16px(여백)
        }}
        title={shouldShowSidebar ? "사이드바 숨기기" : "사이드바 열기"}
      >
        {!shouldShowSidebar ? (
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <PanelLeft size={20} />
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-1"
            >
              <ChevronRight size={16} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="mr-1"
            >
              <ChevronLeft size={16} />
            </motion.div>
            <PanelRight size={20} />
          </motion.div>
        )}
      </Button>

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
        {/* 전체 레이아웃을 flex-col로 구성 */}
        <div className="h-full flex flex-col">

          {/* 상단 구역: 그룹챗 (고정) */}
          {showGroupChat && currentGroup && (
            <div className="flex-shrink-0">
              <GroupChatVideoSection
                isInCall={groupChatProps.isInCall}
                participants={groupChatProps.participants}
              />
            </div>
          )}
          
          {/* 동적 컨텐츠 영역 - 그룹챗 바로 아래, 스크롤 가능 */}
          {dynamicContent && (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full sidebar-scroll">
                {dynamicContent}
              </ScrollArea>
            </div>
          )}
          
          {/* 하단 구역: 스크롤 가능 컨텐츠 (메인/프로필 페이지에서만) */}
          {!currentGroup && (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full sidebar-scroll">
                <div className="pb-4">
                  {/* 새 그룹 만들기 버튼 */}
                  {shouldShowSidebar && showCreateGroupButton && (
                    <div className={`p-4 border-b border-gray-800 transition-all duration-300 ${
                      sidebarPinned ? 'opacity-100' : 'opacity-90'
                    } ${
                      !sidebarPinned ? 'border-t border-gray-800' : ''
                    }`}>
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
                    </div>
                  )}

                  {/* Received Invitations Section */}
                  <ReceivedInvitationsSection />

                  {/* Groups List */}
                  {showGroupsSection && (
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
                            className="flex-1 text-left px-3 py-3 rounded-lg hover:bg-gray-800 transition-colors text-base cursor-pointer text-white group"
                            onClick={() => {
                              // Next.js 라우터로 SPA 방식 이동
                              router.push(`/group/${group.groupId}`)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{group.name}</span>
                              <span className="text-xs text-gray-500">
                                {groupFormatters.formatMemberCount(group.memberCount || 0)}
                              </span>
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
                              className="ml-4 overflow-hidden"
                            >
                              {/* 관리 버튼들 */}
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
                                <button 
                                  onClick={() => setInviteGroupTarget(group)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300"
                                >
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
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
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

      {/* Group Invite Modal */}
      {inviteGroupTarget && (
        <GroupInviteModal
          groupId={inviteGroupTarget.groupId}
          groupName={inviteGroupTarget.name}
          isOpen={!!inviteGroupTarget}
          onClose={() => setInviteGroupTarget(null)}
        />
      )}
    </>
  )
}