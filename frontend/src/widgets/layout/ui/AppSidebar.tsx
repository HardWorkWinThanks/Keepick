'use client'

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Settings, Check } from 'lucide-react'
import { FriendsTabWidget } from "@/widgets/friends"
import { useMainGroups } from "@/features/main-integration/model/useMainGroups"
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area"
import { GroupApi } from "@/features/group-management/api/groupApi"
import { GroupListApi, type GroupListItem } from "@/features/group-management/api/groupListApi"
import { useModal } from "@/shared/ui/modal/Modal"
import CreateGroupModal from "@/features/group-management/ui/CreateGroupModal"

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
  const [friendsSectionExpanded, setFriendsSectionExpanded] = useState(true)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editedGroupName, setEditedGroupName] = useState(currentGroup?.name || '')
  const [editedGroupDescription, setEditedGroupDescription] = useState(currentGroup?.description || '')
  const [myGroups, setMyGroups] = useState<GroupListItem[]>([])
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const createGroupModal = useModal()
  const { groups, navigateToGroup } = useMainGroups()
  const { isLoggedIn } = useMainAuth()

  // 로그인 시 내 그룹 목록 캐시
  useEffect(() => {
    if (isLoggedIn && currentGroup) {
      GroupListApi.getMyGroups()
        .then(setMyGroups)
        .catch(error => console.error('그룹 목록 조회 실패:', error))
    }
  }, [isLoggedIn, currentGroup])

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

  const canEditGroup = true // TODO: 그룹 생성자인지 확인하는 로직

  const toggleEditGroup = async () => {
    if (isEditingGroup) {
      // 저장 로직
      if (currentGroup) {
        try {
          const updatedGroup = await GroupApi.updateGroup(currentGroup.id, {
            name: editedGroupName,
            description: editedGroupDescription,
            thumbnailUrl: currentGroup.thumbnailImage || ""
          })
          
          // TODO: 성공 시 그룹 데이터 업데이트
          console.log('그룹 정보 수정 완료:', updatedGroup)
        } catch (error) {
          console.error('그룹 정보 수정 중 오류:', error)
          // TODO: 에러 처리 (토스트 메시지 등)
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
  if (!isLoggedIn) {
    return null
  }

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

      {/* Sidebar Toggle Button - 헤더 바로 아래 좌측 위치, 사이드바 고정시 우측 이동 */}
      <div 
        onClick={toggleSidebarPin}
        className={`fixed top-16 z-50 cursor-pointer transition-all duration-300 hover:scale-110 ${
          sidebarPinned ? 'left-[254px]' : 'left-4'
        }`}
        style={{ zIndex: 60 }}
        title="사이드바 고정/해제"
      >
        <span className="text-2xl text-white">☰</span>
      </div>

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
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {myGroups.map((group) => (
                        <button
                          key={group.groupId}
                          onClick={() => {
                            navigateToGroup(group.name)
                            setIsGroupDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                            currentGroup.id === group.groupId.toString() 
                              ? 'bg-orange-500/20 text-orange-400' 
                              : 'text-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{group.name}</span>
                            <span className="text-xs text-gray-500">{group.memberCount}명</span>
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
                  <div className={`aspect-square w-full bg-[#333333] rounded-lg overflow-hidden border ${
                    isEditingGroup ? 'border-orange-500/30' : 'border-white/10'
                  }`}>
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
                    {isEditingGroup && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs">썸네일 수정 준비중</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 그룹 설명 */}
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">그룹 설명</p>
                  {isEditingGroup ? (
                    <textarea
                      value={editedGroupDescription}
                      onChange={(e) => setEditedGroupDescription(e.target.value)}
                      className="w-full bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm leading-relaxed border border-orange-500/30 focus:border-orange-500 focus:outline-none resize-none"
                      rows={3}
                      placeholder="그룹 설명을 입력하세요"
                    />
                  ) : (
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {currentGroup.description}
                    </p>
                  )}
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
                <div className="space-y-1">
                {groups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    {/* Group Item */}
                    <div className="flex items-center justify-between group">
                      <button 
                        className="flex-1 text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm cursor-pointer"
                        onClick={() => navigateToGroup(group.name)}
                      >
                        {group.name}
                      </button>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="p-1 rounded hover:bg-gray-800 transition-all duration-200"
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
        </ScrollArea>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={createGroupModal.isOpen}
        onClose={createGroupModal.onClose}
      />
    </>
  )
}