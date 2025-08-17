// features/group-invitation-response/ui/ReceivedInvitationsSection.tsx

"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/shared/ui/shadcn/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { useReceivedInvitations } from '../model/useReceivedInvitations'

interface ReceivedInvitationsSectionProps {
  className?: string
}

export function ReceivedInvitationsSection({ className = '' }: ReceivedInvitationsSectionProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const {
    receivedInvitations,
    invitationCount,
    isLoading,
    isAccepting,
    isRejecting,
    acceptInvitation,
    rejectInvitation
  } = useReceivedInvitations()

  // 받은 초대 섹션은 항상 표시 (빈 상태도 보여줌)

  const handleAccept = async (groupId: number, invitationId?: number) => {
    if (!invitationId) {
      console.error('초대 ID가 없습니다.')
      return
    }
    
    console.log(`초대 수락 처리 시작: groupId=${groupId}, invitationId=${invitationId}`)
    
    try {
      const result = await acceptInvitation({ groupId, invitationId })
      console.log('초대 수락 완료:', result)
      
      // 수락 성공 시 그룹으로 이동
      router.push(`/group/${groupId}`)
    } catch (error) {
      // 에러는 mutation에서 처리되지만, 추가 로깅
      console.error('UI 레벨에서 초대 수락 실패 감지:', {
        error,
        groupId,
        invitationId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleReject = (groupId: number, invitationId?: number) => {
    if (!invitationId) {
      console.error('초대 ID가 없습니다.')
      return
    }
    rejectInvitation({ groupId, invitationId })
  }

  return (
    <div className={`border-b border-gray-800 ${className}`}>
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-400">받은 초대</h3>
            {invitationCount > 0 && (
              <div className="w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {invitationCount}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-800 transition-all duration-200"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-400 transition-transform duration-200" />
            ) : (
              <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
            )}
          </button>
        </div>

        {/* 초대 목록 */}
        <AnimatePresence>
          {isExpanded && (
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
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    초대 목록을 불러오는 중...
                  </div>
                ) : receivedInvitations.length > 0 ? (
                  receivedInvitations.map((invitation) => (
                    <motion.div
                      key={invitation.groupId}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        {/* 그룹 썸네일 */}
                        {invitation.thumbnailUrl && (
                          <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                            <Image
                              src={invitation.thumbnailUrl || "/placeholder/photo-placeholder.svg"}
                              alt={`${invitation.name} 썸네일`}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {/* 그룹 정보 */}
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-white truncate">
                              {invitation.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              그룹 초대를 받았습니다
                            </p>
                          </div>
                          
                          {/* 액션 버튼 */}
                          <div className="flex w-full">
                            <button
                              onClick={() => handleAccept(invitation.groupId, invitation.invitationId)}
                              disabled={isAccepting || isRejecting}
                              className="group relative flex-1 px-3 py-2 text-white hover:text-green-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <Check size={12} />
                                <span className="font-keepick-primary text-xs tracking-wide">수락</span>
                              </div>
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300 group-disabled:w-0"></div>
                            </button>
                            <button
                              onClick={() => handleReject(invitation.groupId, invitation.invitationId)}
                              disabled={isAccepting || isRejecting}
                              className="group relative flex-1 px-3 py-2 text-white hover:text-red-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <X size={12} />
                                <span className="font-keepick-primary text-xs tracking-wide">거절</span>
                              </div>
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-300 group-disabled:w-0"></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    받은 초대가 없습니다
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}