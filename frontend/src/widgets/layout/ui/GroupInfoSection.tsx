'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Check, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useGroupManagement } from "@/features/group-management"

interface GroupInfoSectionProps {
  currentGroup?: {
    id: string
    name: string
    description: string
    thumbnailUrl?: string
  }
  // 그룹 편집 관련 상태와 핸들러들
  isEditingGroup: boolean
  setIsEditingGroup: (editing: boolean) => void
  editedGroupName: string
  setEditedGroupName: (name: string) => void
  editedGroupDescription: string
  setEditedGroupDescription: (description: string) => void
  tempThumbnailUrl: string | null
  setTempThumbnailUrl: (url: string | null) => void
  updateGroup: any // TODO: 정확한 타입 지정
}

export function GroupInfoSection({
  currentGroup,
  isEditingGroup,
  setIsEditingGroup,
  editedGroupName,
  setEditedGroupName,
  editedGroupDescription,
  setEditedGroupDescription,
  tempThumbnailUrl,
  setTempThumbnailUrl,
  updateGroup
}: GroupInfoSectionProps) {
  const [groupMembersExpanded, setGroupMembersExpanded] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { useGroupMembers } = useGroupManagement()

  // 현재 그룹의 멤버 목록 조회
  const { data: groupMembers = [], isLoading: isLoadingMembers } = useGroupMembers(
    currentGroup ? parseInt(currentGroup.id) : 0
  )

  // 그룹 썸네일 클릭 핸들러 - 갤러리 모드로 전환하고 썸네일 선택 모드 진입
  const handleThumbnailClick = () => {
    if (!currentGroup || !isEditingGroup) return
    
    console.log('그룹 썸네일 변경 요청')
    console.log('현재 경로:', pathname)
    console.log('현재 그룹 ID:', currentGroup.id)
    
    const currentGroupPath = `/group/${currentGroup.id}`
    
    // 그룹 페이지에 있는지 확인
    if (pathname === currentGroupPath) {
      console.log('그룹 페이지에서 갤러리 모드로 전환 및 썸네일 선택 모드 진입')
      // GroupSpaceWidget에 갤러리 모드 전환 및 썸네일 선택 모드 진입 메시지 전송
      window.postMessage({
        type: 'SWITCH_TO_GALLERY_FOR_THUMBNAIL',
        data: { groupId: currentGroup.id }
      }, '*')
    } else {
      // 다른 페이지에 있다면 그룹 페이지로 이동하면서 썸네일 모드 활성화
      console.log('다른 페이지에서 그룹 페이지로 이동')
      const targetUrl = `${currentGroupPath}?mode=thumbnail`
      window.location.href = targetUrl
    }
  }

  const canEditGroup = true // TODO: 그룹 생성자인지 확인하는 로직

  const toggleEditGroup = async () => {
    if (isEditingGroup) {
      // 저장 로직 - Tanstack Query mutation 사용
      if (currentGroup) {
        try {
          // tempThumbnailUrl이 있으면 사용, 없으면 기존 썸네일 유지
          const finalThumbnailUrl = tempThumbnailUrl || currentGroup.thumbnailUrl || ""
          
          await updateGroup.mutateAsync({
            groupId: parseInt(currentGroup.id),
            data: {
              name: editedGroupName,
              description: editedGroupDescription,
              thumbnailUrl: finalThumbnailUrl
            }
          })
          
          // 성공 시 임시 썸네일 상태 초기화
          setTempThumbnailUrl(null)
        } catch (error) {
          // 에러는 useGroupManagement에서 처리됨
          // Tanstack Query가 자동으로 이전 상태로 롤백
        }
      }
      
      // 그룹 편집 모드 종료 시 썸네일 선택 모드도 해제
      const currentGroupPath = `/group/${currentGroup?.id}`
      if (pathname === currentGroupPath && router) {
        // URL에서 mode 파라미터 제거
        router.replace(currentGroupPath)
      }
    } else {
      // 편집 모드 진입
      setEditedGroupName(currentGroup?.name || '')
      setEditedGroupDescription(currentGroup?.description || '')
      setTempThumbnailUrl(null) // 편집 시작 시 임시 썸네일 초기화
    }
    setIsEditingGroup(!isEditingGroup)
  }

  const toggleGroupMembersSection = () => {
    setGroupMembersExpanded(!groupMembersExpanded)
  }

  if (!currentGroup) return null

  return (
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
            <button
              onClick={handleThumbnailClick}
              className="aspect-square w-full bg-[#333333] rounded-lg overflow-hidden border border-orange-500/30 hover:border-orange-500 transition-all duration-300 relative group cursor-pointer"
            >
              {/* 실제 썸네일 이미지 (tempThumbnailUrl 우선 사용) */}
              {(tempThumbnailUrl || currentGroup.thumbnailUrl) ? (
                <Image
                  src={tempThumbnailUrl || currentGroup.thumbnailUrl || "/placeholder/photo-placeholder.svg"}
                  alt={`${currentGroup.name} 썸네일`}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <span className="text-4xl">📸</span>
                </div>
              )}
              {/* 클릭 안내 오버레이 */}
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 group-hover:bg-black/80 transition-all duration-300">
                <div className="text-center">
                  <span className="text-white text-xs leading-tight font-medium">
                    썸네일을 변경하려면 클릭해주세요! (갤러리 모드로 전환)
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div className={`aspect-square w-full bg-[#333333] rounded-lg overflow-hidden border border-white/10 relative`}>
              {currentGroup.thumbnailUrl ? (
                <Image
                  src={currentGroup.thumbnailUrl || "/placeholder/photo-placeholder.svg"}
                  alt={`${currentGroup.name} 썸네일`}
                  fill
                  sizes="240px"
                  className="object-cover"
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
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs relative overflow-hidden">
                            {(member.profileUrl || member.profileImageUrl) ? (
                              <Image 
                                src={member.profileUrl || member.profileImageUrl || ''} 
                                alt={member.nickname || member.name}
                                fill
                                sizes="24px"
                                className="object-cover"
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
  )
}