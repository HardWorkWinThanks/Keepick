'use client'

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Settings, Check, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from "framer-motion"
import { FriendsTabWidget } from "@/widgets/friends"
import { useMainGroups } from "@/features/main-integration/model/useMainGroups"
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { Button } from "@/shared/ui/shadcn/button"
import { useGroupManagement, CreateGroupModal, LeaveGroupModal, GroupManagementApi, groupQueryKeys } from "@/features/group-management"
import { PhotoDropZone } from "@/features/photo-drag-drop"
import { DragPhotoData } from "@/entities/photo"
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
    thumbnailImage?: string
  }
  forceInitialPinned?: boolean
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
  forceInitialPinned = false
}: AppSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([])
  const [groupsSectionExpanded, setGroupsSectionExpanded] = useState(true)
  const [friendsSectionExpanded, setFriendsSectionExpanded] = useState(false) // 초기값을 false로 변경
  const [groupMembersExpanded, setGroupMembersExpanded] = useState(true) // 그룹원 드롭다운 항상 열림
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editedGroupName, setEditedGroupName] = useState(currentGroup?.name || '')
  const [editedGroupDescription, setEditedGroupDescription] = useState(currentGroup?.description || '')
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const [leaveGroupTarget, setLeaveGroupTarget] = useState<GroupListItem | null>(null)
  const createGroupModal = useModal()
  const leaveGroupModal = useModal()
  const { groups, navigateToGroup, isGroupsLoading: mainGroupsLoading } = useMainGroups()
  const { isLoggedIn } = useMainAuth()
  const { updateGroup, useGroupMembers } = useGroupManagement()
  const [isMounted, setIsMounted] = useState(false)
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false)

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

  const toggleFriendsSection = () => {
    setFriendsSectionExpanded(prev => !prev)
  }

  const toggleGroupMembersSection = () => {
    setGroupMembersExpanded(!groupMembersExpanded)
  }

  // 그룹 썸네일 드래그&드롭 핸들러
  const handleThumbnailDrop = async (dragData: DragPhotoData, e: React.DragEvent) => {
    e.preventDefault()
    setThumbnailDragOver(false)
    
    if (!currentGroup) return

    try {
      console.log('썸네일 변경 요청:', dragData)
      
      // originalUrl을 그룹 썸네일로 사용 (고화질 이미지)
      const newThumbnailUrl = dragData.originalUrl || dragData.src
      
      if (!newThumbnailUrl) {
        console.error('썸네일 URL을 찾을 수 없습니다.')
        return
      }
      
      await updateGroup.mutateAsync({
        groupId: parseInt(currentGroup.id),
        data: {
          name: editedGroupName,
          description: editedGroupDescription,
          thumbnailUrl: newThumbnailUrl
        }
      })
    } catch (error) {
      console.error('썸네일 변경 실패:', error)
    }
  }

  const handleThumbnailDragOver = () => {
    setThumbnailDragOver(true)
  }

  const handleThumbnailDragLeave = () => {
    setThumbnailDragOver(false)
  }

  const canEditGroup = true // TODO: 그룹 생성자인지 확인하는 로직

  const toggleEditGroup = async () => {
    if (isEditingGroup) {
      // 저장 로직 - Tanstack Query mutation 사용
      if (currentGroup) {
        try {
          await updateGroup.mutateAsync({
            groupId: parseInt(currentGroup.id),
            data: {
              name: editedGroupName,
              description: editedGroupDescription,
              thumbnailUrl: currentGroup.thumbnailImage || ""
            }
          })
          
          // 성공 시 자동으로 캐시 업데이트되고 토스트 메시지 표시됨
        } catch (error) {
          // 에러는 useGroupManagement에서 처리됨
          // Tanstack Query가 자동으로 이전 상태로 롤백
        }
      }
    } else {
      // 편집 모드 진입
      setEditedGroupName(currentGroup?.name || '')
      setEditedGroupDescription(currentGroup?.description || '')
    }
    setIsEditingGroup(prev => !prev)
  }

  const shouldShowSidebar = sidebarHovered || sidebarPinned

  // 로그인하지 않은 경우 사이드바 숨김
  if (!isMounted || !isLoggedIn) {
    return null
  }

  return (
    <>

      {/* Sidebar Toggle Button - 헤더 바로 아래 좌측 위치, 사이드바 고정시 우측 이동 */}
      <Button
        onClick={toggleSidebarPin}
        variant="ghost" 
        size="icon"
        className={`fixed top-16 z-50 transition-all duration-300 hover:bg-white/10 border-0 text-white hover:text-white ${
          sidebarPinned ? 'left-[254px]' : 'left-4'
        }`}
        style={{ zIndex: 60 }}
        title={sidebarPinned ? "사이드바 숨기기" : "사이드바 고정"}
      >
        <motion.div
          animate={{ rotate: sidebarPinned ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          {sidebarPinned ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </motion.div>
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
        <ScrollArea className="h-full">
          <div className="pb-4">
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

          {/* Current Group Details - 그룹 스페이스에 있을 때만 표시 */}
          {currentGroup && (
            <div className={`p-4 border-b border-gray-800 ${isEditingGroup ? 'bg-orange-500/5 border-orange-500/20' : ''}`}>
              <div className="mb-3">
                {/* 그룹 이름 섹션 헤더 */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-400">그룹 이름</p>
                  {/* 수정 버튼 */}
                  {canEditGroup && (
                    <button
                      onClick={toggleEditGroup}
                      className={`p-1 rounded hover:bg-gray-800 transition-all duration-200 ${
                        isEditingGroup ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'
                      }`}
                      title={isEditingGroup ? "수정 완료" : "그룹 정보 수정"}
                    >
                      {isEditingGroup ? (
                        <Check size={16} className="transition-transform duration-200" />
                      ) : (
                        <Settings size={16} className="transition-transform duration-200" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* 그룹 이름 입력/표시 */}
                {isEditingGroup ? (
                  <input
                    type="text"
                    value={editedGroupName}
                    onChange={(e) => setEditedGroupName(e.target.value)}
                    className="w-full bg-gray-800 text-white px-2 py-1 rounded text-base font-semibold border border-orange-500/30 focus:border-orange-500 focus:outline-none"
                    placeholder="그룹 이름을 입력하세요"
                  />
                ) : (
                  <h3 className="text-base font-semibold text-white">{currentGroup.name}</h3>
                )}
              </div>
              
              <div className="space-y-3">
                {/* 그룹 썸네일 */}
                <div className="w-full mt-2">
                  <p className="text-xs font-medium text-gray-400 mb-2">그룹 썸네일</p>
                  {isEditingGroup ? (
                    <PhotoDropZone
                      onDrop={handleThumbnailDrop}
                      onDragOver={handleThumbnailDragOver}
                      onDragLeave={handleThumbnailDragLeave}
                      isDragOver={thumbnailDragOver}
                      dropZoneId="group-thumbnail"
                      className={`aspect-square w-full bg-[#333333] rounded-lg overflow-hidden border relative ${
                        thumbnailDragOver ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-orange-500/30'
                      }`}
                    >
                      {currentGroup.thumbnailImage ? (
                        <img
                          src={currentGroup.thumbnailImage}
                          alt={`${currentGroup.name} 썸네일`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <span className="text-4xl">📸</span>
                        </div>
                      )}
                      {/* 드래그&드롭 가이드 오버레이 */}
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2">
                        <div className="text-center">
                          {thumbnailDragOver ? (
                            <span className="text-orange-400 text-xs font-medium">
                              여기에 놓으세요!
                            </span>
                          ) : (
                            <span className="text-white text-xs leading-tight">
                              갤러리에서 마음에 드는 사진을 그룹 썸네일로 드래그&드롭으로 변경할 수 있습니다
                            </span>
                          )}
                        </div>
                      </div>
                    </PhotoDropZone>
                  ) : (
                    <div className={`aspect-square w-full bg-[#333333] rounded-lg overflow-hidden border border-white/10`}>
                      {currentGroup.thumbnailImage ? (
                        <img
                          src={currentGroup.thumbnailImage}
                          alt={`${currentGroup.name} 썸네일`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <span className="text-4xl">📸</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 그룹 설명 */}
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">그룹 설명</p>
                  {isEditingGroup ? (
                    <div>
                      <textarea
                        value={editedGroupDescription}
                        onChange={(e) => {
                          if (e.target.value.length <= 100) {
                            setEditedGroupDescription(e.target.value)
                          }
                        }}
                        className="w-full bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm leading-relaxed border border-orange-500/30 focus:border-orange-500 focus:outline-none resize-none"
                        rows={3}
                        placeholder="그룹 설명을 입력하세요 (최대 100자)"
                        maxLength={100}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {editedGroupDescription.length}/100자
                        </span>
                        {editedGroupDescription.length > 80 && (
                          <span className="text-xs text-orange-400">
                            {100 - editedGroupDescription.length}자 남음
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 leading-relaxed break-words">
                      {currentGroup.description || "그룹 설명이 없습니다."}
                    </p>
                  )}
                </div>
                
                {/* 그룹원 목록 */}
                <div className="mt-4 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-400">그룹원</p>
                      <span className="text-xs text-gray-500">
                        {groupMembers.length}명
                      </span>
                    </div>
                    <button
                      onClick={toggleGroupMembersSection}
                      className="p-1 rounded hover:bg-gray-800 transition-all duration-200"
                    >
                      <motion.div
                        animate={{ 
                          rotate: groupMembersExpanded ? 90 : 0 
                        }}
                        transition={{ 
                          duration: 0.3, 
                          ease: [0.32, 0.72, 0, 1] 
                        }}
                      >
                        <ChevronRight size={12} className="text-gray-400" />
                      </motion.div>
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {groupMembersExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.32, 0.72, 0, 1],
                          opacity: { duration: 0.25 }
                        }}
                        className="overflow-hidden"
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
                        >
                          {isLoadingMembers ? (
                            <div className="flex justify-center py-2">
                              <div className="text-xs text-gray-500">로딩 중...</div>
                            </div>
                          ) : (
                            <div 
                              className="space-y-2"
                              style={{
                                maxHeight: groupMembers.length > 6 ? '144px' : 'auto', // 6명 * 24px(height) = 144px
                                overflowY: groupMembers.length > 6 ? 'auto' : 'visible'
                              }}
                            >
                              <style jsx>{`
                                div::-webkit-scrollbar {
                                  width: 4px;
                                }
                                div::-webkit-scrollbar-track {
                                  background: transparent;
                                }
                                div::-webkit-scrollbar-thumb {
                                  background: rgba(156, 163, 175, 0.3);
                                  border-radius: 2px;
                                }
                                div::-webkit-scrollbar-thumb:hover {
                                  background: rgba(156, 163, 175, 0.5);
                                }
                              `}</style>
                              {groupMembers.map((member, index) => (
                                <div key={member.memberId || `member-${index}`} className="flex items-center gap-2 p-1">
                                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                                    {(member.profileUrl || member.profileImageUrl) ? (
                                      <img 
                                        src={member.profileUrl || member.profileImageUrl || ''} 
                                        alt={member.nickname || member.name}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-gray-400">
                                        {(member.nickname || member.name)?.charAt(0) || '?'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-300 truncate">
                                      {member.nickname || member.name || '알 수 없음'}
                                    </p>
                                    {member.role === 'OWNER' && (
                                      <span className="text-xs text-orange-400">👑 리더</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {groupMembers.length === 0 && (
                                <div className="text-center py-2">
                                  <p className="text-xs text-gray-500">그룹원이 없습니다.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

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
                                <img
                                  src={group.thumbnailUrl}
                                  alt={`${group.name} 썸네일`}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
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

          {/* Friends Section */}
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