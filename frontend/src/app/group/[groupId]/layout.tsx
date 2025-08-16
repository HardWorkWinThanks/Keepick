'use client'

import React, { useState, useEffect } from 'react'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { useSidebar } from '@/widgets/layout/model/useSidebar'
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import AppHeader from '@/widgets/layout/ui/AppHeader'
import AppSidebar from '@/widgets/layout/ui/AppSidebar'
import { GroupSelectorSection } from '@/widgets/layout/ui/GroupSelectorSection'
import { GroupInfoSection } from '@/widgets/layout/ui/GroupInfoSection'
import { GalleryPhotosSection } from '@/widgets/layout/ui/GalleryPhotosSection'
import { AlbumEditSidebar } from '@/widgets/layout'
import { useModal } from "@/shared/ui/modal/Modal"
import { CreateGroupModal, useGroupManagement } from "@/features/group-management"
import { useGroupInfo } from "@/features/group-management"
import { useAuthGuard } from "@/features/auth/model/useAuthGuard"
import { useTimelineEditor } from '@/features/timeline-album/model/useTimelineEditor'
import { useTimelinePhotos } from '@/features/timeline-album/model/useTimelinePhotos'
import type { DragPhotoData, Photo } from '@/entities/photo'
import { addPhotosToTimelineAlbum, removePhotosFromTimelineAlbum } from '@/features/timeline-album/api/timelineAlbumPhotos'
import { useRouter } from 'next/navigation'

interface GroupLayoutProps {
  children: React.ReactNode
}

// 타임라인 편집 사이드바 컴포넌트 (실시간 데이터 전달받음)
function TimelineEditSidebar() {
  const pathname = usePathname()
  const albumId = pathname.match(/timeline\/(\d+)/)?.[1]
  const groupId = pathname.match(/group\/(\d+)/)?.[1]
  
  if (!groupId || !albumId) return null
  
  // window 이벤트로 메인페이지의 실시간 데이터 수신
  return <TimelineEditSidebarContent groupId={groupId} albumId={albumId} />
}

// 티어 편집 사이드바 컴포넌트 (실시간 데이터 전달받음)
function TierEditSidebar() {
  const pathname = usePathname()
  const albumId = pathname.match(/tier\/(\d+)/)?.[1]
  const groupId = pathname.match(/group\/(\d+)/)?.[1]
  
  if (!groupId || !albumId) return null
  
  return <TierEditSidebarContent groupId={groupId} albumId={albumId} />
}

// 하이라이트 편집 사이드바 컴포넌트 (그룹챗만 표시)
function HighlightEditSidebar() {
  const searchParams = useSearchParams()
  
  // URL 기반으로 편집 모드 확인
  const isEditModeFromURL = searchParams.get('edit') === 'true'
  
  // 편집 모드가 아니면 null 반환 (그룹챗만 표시됨)
  if (!isEditModeFromURL) {
    return null
  }
  
  // 편집 모드에서도 그룹챗만 표시하므로 null 반환
  return null
}

// 타임라인 편집 사이드바 내용 컴포넌트
function TimelineEditSidebarContent({ groupId, albumId }: { groupId: string, albumId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null)
  
  // URL 기반으로 편집 모드 확인 (사이드바는 URL이 더 정확함)
  const isEditModeFromURL = searchParams.get('edit') === 'true'
  
  // 메인페이지에서 실시간 availablePhotos 수신
  useEffect(() => {
    const handleAvailablePhotosUpdate = (event: CustomEvent) => {
      setAvailablePhotos(event.detail || [])
    }

    window.addEventListener('timelineAvailablePhotosUpdate', handleAvailablePhotosUpdate as EventListener)
    
    return () => {
      window.removeEventListener('timelineAvailablePhotosUpdate', handleAvailablePhotosUpdate as EventListener)
    }
  }, [])
  
  // 갤러리에서 사진 추가 핸들러
  const handleAddPhotos = () => {
    // 갤러리로 이동하기 전에 편집 상태 저장 요청
    window.dispatchEvent(new CustomEvent('saveTimelineEditingState'))
    
    // 갤러리 페이지로 이동하면서 타임라인 편집 모드임을 표시
    router.push(`/group/${groupId}?album=gallery&mode=add&target=timeline&albumId=${albumId}`)
  }
  
  // 사진 삭제 핸들러
  const handleDeletePhotos = async (photoIds: number[]) => {
    try {
      setLoading(true)
      // 서버에서 사진 삭제
      await removePhotosFromTimelineAlbum(parseInt(groupId), parseInt(albumId), photoIds)
      
      // 로컬 상태에서도 삭제
      setAvailablePhotos(prev => prev.filter(photo => !photoIds.includes(photo.id)))
      
      // 메인페이지에도 삭제 알림 (editor hook에서 처리하도록)
      window.dispatchEvent(new CustomEvent('timelinePhotosDeleted', { detail: photoIds }))
      
    } catch (error) {
      alert('사진 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, photo: Photo) => {
    setDraggingPhotoId(photo.id)
    const dragData: DragPhotoData = {
      photoId: photo.id,
      source: 'gallery',
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: photo.name
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copyMove' // 대표이미지와 섹션 이동 모두 지원
  }
  
  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    setDraggingPhotoId(null)
  }
  
  // 드롭 핸들러 (섹션에서 사이드바로 드래그된 사진 처리)
  const handleDrop = (dragData: DragPhotoData) => {
    // window 이벤트로 TimelineAlbumPage에 알림
    window.dispatchEvent(new CustomEvent('timelineSidebarDrop', { detail: dragData }))
  }
  
  if (!isEditModeFromURL) {
    return null
  }
  
  return (
    <GalleryPhotosSection
      availablePhotos={availablePhotos}
      draggingPhotoId={draggingPhotoId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onAddPhotos={handleAddPhotos}
      onDeletePhotos={handleDeletePhotos}
      title="타임라인 편집용 사진"
      showControls={true}
    />
  )
}

// 티어 편집 사이드바 내용 컴포넌트
function TierEditSidebarContent({ groupId, albumId }: { groupId: string, albumId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null)
  
  // URL 기반으로 편집 모드 확인
  const isEditModeFromURL = searchParams.get('edit') === 'true'
  
  // 메인페이지에서 실시간 availablePhotos 수신
  useEffect(() => {
    const handleAvailablePhotosUpdate = (event: CustomEvent) => {
      setAvailablePhotos(event.detail || [])
    }

    const handleEditModeChanged = (event: CustomEvent) => {
      const { isEditMode: editMode, availablePhotos: photos } = event.detail || {}
      if (editMode && photos) {
        setAvailablePhotos(photos)
      }
    }

    // 기본 이벤트 리스너
    window.addEventListener('tierAvailablePhotosUpdate', handleAvailablePhotosUpdate as EventListener)
    // 편집 모드 변경 이벤트 리스너 (추가 안전장치)
    window.addEventListener('tierEditModeChanged', handleEditModeChanged as EventListener)
    
    // 컴포넌트 마운트 시 메인페이지에 데이터 요청
    window.dispatchEvent(new CustomEvent('tierSidebarMounted'))
    
    return () => {
      window.removeEventListener('tierAvailablePhotosUpdate', handleAvailablePhotosUpdate as EventListener)
      window.removeEventListener('tierEditModeChanged', handleEditModeChanged as EventListener)
    }
  }, [])
  
  // 갤러리에서 사진 추가 핸들러
  const handleAddPhotos = () => {
    // 갤러리로 이동 (추가 모드로) - 그룹 페이지에서 갤러리 모드로
    window.location.href = `/group/${groupId}?gallery=true&mode=add&target=tier&albumId=${albumId}`
  }
  
  // 사진 삭제 핸들러 - TierAlbumPage와 동일한 API 사용
  const handleDeletePhotos = async (photoIds: number[]) => {
    try {
      setLoading(true)
      // TierAlbumPage에서 처리하도록 window 이벤트로 전달
      window.dispatchEvent(new CustomEvent('tierPhotosDeleteRequest', { detail: photoIds }))
      
    } catch (error) {
      alert('사진 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, photo: Photo) => {
    setDraggingPhotoId(photo.id)
    const dragData: DragPhotoData = {
      photoId: photo.id,
      source: 'available',
      originalUrl: photo.originalUrl,
      thumbnailUrl: photo.thumbnailUrl,
      name: photo.name
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
  }
  
  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    setDraggingPhotoId(null)
  }
  
  // 드롭 핸들러 (티어에서 사이드바로 드래그된 사진 처리)
  const handleDrop = (dragData: DragPhotoData) => {
    // window 이벤트로 TierAlbumPage에 알림
    window.dispatchEvent(new CustomEvent('tierSidebarDrop', { detail: dragData }))
  }
  
  if (!isEditModeFromURL) {
    return null
  }
  
  return (
    <GalleryPhotosSection
      availablePhotos={availablePhotos}
      draggingPhotoId={draggingPhotoId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onAddPhotos={handleAddPhotos}
      onDeletePhotos={handleDeletePhotos}
      title="티어 편집용 사진"
      showControls={true}
    />
  )
}

// 사이드바 컨텐츠를 결정하는 내부 컴포넌트
function GroupLayoutContent({ children }: GroupLayoutProps) {
  const { groupId: groupIdParam } = useParams() as { groupId: string }
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const groupId = parseInt(groupIdParam)
  
  // 인증 및 사이드바 상태
  const { isAuthenticated } = useAuthGuard()
  const sidebarProps = useSidebar(true) // 그룹 내에서는 항상 고정 시작
  const { isLoggedIn } = useMainAuth()
  const [isMounted, setIsMounted] = useState(false)
  
  // 그룹 정보 및 관리
  const { data: groupData, isLoading, error } = useGroupInfo(groupId)
  const { updateGroup } = useGroupManagement()
  const createGroupModal = useModal()
  
  // 그룹 정보 편집 상태
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editedGroupName, setEditedGroupName] = useState('')
  const [editedGroupDescription, setEditedGroupDescription] = useState('')
  const [tempThumbnailUrl, setTempThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 그룹 데이터 로드 시 편집 상태 초기화
  useEffect(() => {
    if (groupData) {
      setEditedGroupName(groupData.name || '')
      setEditedGroupDescription(groupData.description || '')
    }
  }, [groupData])

  // 갤러리에서 썸네일 선택 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'THUMBNAIL_SELECTED') {
        const { thumbnailUrl, groupId: messageGroupId } = event.data.data
        
        if (groupData && messageGroupId === groupData.groupId.toString()) {
          console.log('썸네일 임시 변경:', thumbnailUrl)
          setTempThumbnailUrl(thumbnailUrl)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [groupData])

  // URL 기반 사이드바 동적 컨텐츠 결정
  const getDynamicContent = () => {
    if (!groupData) return null

    const currentGroup = {
      id: groupData.groupId.toString(),
      name: groupData.name,
      description: groupData.description,
      thumbnailUrl: groupData.thumbnailUrl || "/dummy/jeju-dummy1.webp"
    }

    // 그룹스페이스 - 그룹 선택 + 그룹 정보
    if (pathname === `/group/${groupId}`) {
      return (
        <>
          <GroupSelectorSection 
            currentGroup={currentGroup}
            showCreateGroupButton={true}
            isMounted={isMounted}
            createGroupModal={createGroupModal}
          />
          
          <GroupInfoSection 
            currentGroup={currentGroup}
            isEditingGroup={isEditingGroup}
            setIsEditingGroup={setIsEditingGroup}
            editedGroupName={editedGroupName}
            setEditedGroupName={setEditedGroupName}
            editedGroupDescription={editedGroupDescription}
            setEditedGroupDescription={setEditedGroupDescription}
            tempThumbnailUrl={tempThumbnailUrl}
            setTempThumbnailUrl={setTempThumbnailUrl}
            updateGroup={updateGroup}
          />
        </>
      )
    }

    // 타임라인 앨범 편집 모드: /group/[groupId]/timeline/[albumId]?edit=true
    const timelineMatch = pathname.match(/^\/group\/\d+\/timeline\/\d+$/)
    if (timelineMatch && searchParams.get('edit') === 'true') {
      return <TimelineEditSidebar />
    }

    // 티어 앨범 편집 모드: /group/[groupId]/tier/[albumId]?edit=true
    const tierMatch = pathname.match(/^\/group\/\d+\/tier\/(\d+)$/)
    if (tierMatch && searchParams.get('edit') === 'true') {
      return <TierEditSidebar />
    }

    // 하이라이트 앨범 편집 모드: /group/[groupId]/highlight/[albumId]?edit=true
    const highlightMatch = pathname.match(/^\/group\/\d+\/highlight\/(\d+)$/)
    if (highlightMatch && searchParams.get('edit') === 'true') {
      return <HighlightEditSidebar />
    }
    
    return null // 기타 경로는 그룹챗만
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return null
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-white text-xl">그룹 정보를 불러오는 중...</div>
      </div>
    )
  }

  // 에러 상태
  if (error || !groupData) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error ? '그룹을 불러오는 중 오류가 발생했습니다.' : '그룹을 찾을 수 없습니다.'}
          </div>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111]">
      {/* 그룹 레벨 사이드바 */}
      <AppSidebar 
        {...sidebarProps}
        showGroupChat={true}
        showCreateGroupButton={false} // 중복 방지
        showGroupsSection={false}
        showFriendsSection={false}
        currentGroup={{
          id: groupData.groupId.toString(),
          name: groupData.name,
          description: groupData.description,
          thumbnailUrl: groupData.thumbnailUrl || "/dummy/jeju-dummy1.webp"
        }}
        dynamicContent={getDynamicContent()}
      />
      
      {/* 메인 컨텐츠 */}
      <div className={`transition-all duration-200 ease-out ${
        isMounted && isLoggedIn && sidebarProps.sidebarPinned ? "ml-[240px]" : "ml-0"
      }`}>
        <AppHeader 
          sidebarPinned={sidebarProps.sidebarPinned}
          showLogo={true}
          logoText="Keepick"
        />
        
        {/* 페이지 컨텐츠 */}
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

// 메인 레이아웃 컴포넌트 - 단순화됨 
export default function GroupLayout({ children }: GroupLayoutProps) {
  return <GroupLayoutContent>{children}</GroupLayoutContent>
}