'use client'

import React, { useState, useEffect } from 'react'
import { useSidebar } from '../model/useSidebar'
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { GroupSelectorSection } from './GroupSelectorSection'
import { GroupInfoSection } from './GroupInfoSection'
import { useModal } from "@/shared/ui/modal/Modal"
import { CreateGroupModal, LeaveGroupModal, useGroupManagement } from "@/features/group-management"

interface AppLayoutProps {
  children: React.ReactNode
  showCenterButton?: boolean
  onSpillPhotos?: () => void
  centerButtonText?: string
  centerButtonTitle?: string
  showLogo?: boolean
  logoText?: string
  backgroundColor?: string
  sidebarConfig?: {
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
      participants?: any[]
    }
    // 페이지별 동적 컨텐츠
    dynamicContent?: React.ReactNode
    // 기본 컨텐츠 사용 여부 (그룹 선택/정보)
    useDefaultContent?: boolean
  }
  headerConfig?: {
    showLogo?: boolean
    logoText?: string
  }
  className?: string
}

export default function AppLayout({ 
  children, 
  showCenterButton = false,
  onSpillPhotos,
  centerButtonText = "!!!",
  centerButtonTitle = "사진 쏟기",
  showLogo = true,
  logoText = "Keepick",
  backgroundColor = "#111111",
  sidebarConfig = {
    showCreateGroupButton: true,
    showGroupsSection: true,
    showFriendsSection: true
  },
  headerConfig = {},
  className = ""
}: AppLayoutProps) {
  const sidebarProps = useSidebar(sidebarConfig?.forceInitialPinned)
  const { isLoggedIn } = useMainAuth()
  const [isMounted, setIsMounted] = useState(false)
  
  // 그룹 관리 모달
  const createGroupModal = useModal()
  
  // 그룹 관리 기능
  const { updateGroup } = useGroupManagement()
  
  // 그룹 정보 편집 상태 (기본 컨텐츠용)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editedGroupName, setEditedGroupName] = useState(sidebarConfig?.currentGroup?.name || '')
  const [editedGroupDescription, setEditedGroupDescription] = useState(sidebarConfig?.currentGroup?.description || '')
  const [tempThumbnailUrl, setTempThumbnailUrl] = useState<string | null>(null)

  // Hydration 완료 후에만 인증 상태 기반 렌더링 적용
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 갤러리에서 썸네일 선택 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'THUMBNAIL_SELECTED') {
        const { thumbnailUrl, groupId: messageGroupId } = event.data.data
        
        // 현재 그룹과 메시지의 그룹 ID가 일치할 때만 업데이트
        if (sidebarConfig?.currentGroup && messageGroupId === sidebarConfig.currentGroup.id) {
          console.log('썸네일 임시 변경:', thumbnailUrl)
          setTempThumbnailUrl(thumbnailUrl)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [sidebarConfig?.currentGroup])

  // 기본 동적 컨텐츠 생성 (그룹 선택 + 그룹정보)
  const defaultDynamicContent = sidebarConfig?.useDefaultContent ? (
    <>
      <GroupSelectorSection 
        currentGroup={sidebarConfig?.currentGroup}
        showCreateGroupButton={sidebarConfig?.showCreateGroupButton}
        isMounted={isMounted}
        createGroupModal={createGroupModal}
      />
      
      {sidebarConfig?.currentGroup && (
        <GroupInfoSection 
          currentGroup={sidebarConfig.currentGroup}
          isEditingGroup={isEditingGroup}
          setIsEditingGroup={setIsEditingGroup}
          editedGroupName={editedGroupName}
          setEditedGroupName={setEditedGroupName}
          editedGroupDescription={editedGroupDescription}
          setEditedGroupDescription={setEditedGroupDescription}
          tempThumbnailUrl={tempThumbnailUrl}
          setTempThumbnailUrl={setTempThumbnailUrl}
          updateGroup={updateGroup} // 실제 updateGroup mutation 연결
        />
      )}
    </>
  ) : null
  
  // 최종 동적 컨텐츠 결정
  const finalDynamicContent = sidebarConfig?.dynamicContent || defaultDynamicContent

  return (
    <div className={`min-h-screen ${className}`} style={{ backgroundColor }}>
      <AppSidebar 
        {...sidebarProps} 
        {...sidebarConfig}
        dynamicContent={finalDynamicContent}
      />
      
      <div className={`transition-all duration-200 ease-out ${
        isMounted && isLoggedIn && sidebarProps.sidebarPinned ? "ml-[240px]" : "ml-0"
      }`}>
        <AppHeader 
          sidebarPinned={sidebarProps.sidebarPinned}
          showCenterButton={showCenterButton}
          onSpillPhotos={onSpillPhotos}
          centerButtonText={centerButtonText}
          centerButtonTitle={centerButtonTitle}
          showLogo={showLogo}
          logoText={logoText}
          {...headerConfig}
        />
        
        {/* 메인 영역 */}
        <div>
          {children}
        </div>
      </div>
      
      {/* 그룹 생성 모달 */}
      <CreateGroupModal 
        isOpen={createGroupModal.isOpen}
        onClose={createGroupModal.onClose}
      />
    </div>
  )
}