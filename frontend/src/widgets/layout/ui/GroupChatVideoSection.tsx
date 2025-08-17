'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { InteractiveHoverButton } from '@/shared/ui/composite/InteractiveHoverButton'

// 임시 참가자 타입 (추후 실제 타입으로 교체 예정)
interface Participant {
  id: string
  name: string
  isMe?: boolean
  // TODO: 실제 비디오 스트림 데이터 추가
}

interface GroupChatVideoSectionProps {
  // TODO: 실제 화상회의 상태 props 추가
  isInCall?: boolean
  participants?: Participant[]
}

export function GroupChatVideoSection({ 
  isInCall = false,
  participants = []
}: GroupChatVideoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // 임시 데이터 (테스트용) - 추후 실제 데이터로 교체
  const mockParticipants: Participant[] = [
    // { id: '1', name: '나', isMe: true },
    // { id: '2', name: '김철수' },
    // { id: '3', name: '이영희' },
    // { id: '4', name: '박민수' },
    // { id: '5', name: '최지원' },
  ]
  
  const currentParticipants = participants.length > 0 ? participants : mockParticipants
  const participantCount = currentParticipants.length

  // 참가자 수에 따른 그리드 클래스 결정
  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
      case 4:
        return 'grid-cols-2'
      case 5:
      case 6:
        return 'grid-cols-2'
      default:
        return 'grid-cols-2'
    }
  }

  // 마지막 행에서 중앙 정렬이 필요한지 확인
  const needsCenterAlignment = (index: number, total: number) => {
    if (total === 3 && index === 2) return true // 3명일 때 마지막
    if (total === 5 && index === 4) return true // 5명일 때 마지막
    return false
  }

  return (
    <div className="border-b border-gray-800">
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">그룹챗</h3>
          {isInCall && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              연결됨
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-gray-300" />
        ) : (
          <ChevronDown size={18} className="text-gray-300" />
        )}
      </button>

      {/* 비디오 그리드 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {/* 0명일 때 그룹챗 시작 UI */}
              {participantCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[200px]">
                  <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                    <Users size={36} className="text-gray-400" />
                  </div>
                  <h4 className="text-white font-medium text-sm mb-2">그룹챗이 비어있어요</h4>
                  <p className="text-gray-400 text-xs text-center mb-6 leading-relaxed">
                    친구들과 화상통화를 시작해보세요!
                  </p>
                  <InteractiveHoverButton
                    variant="ghost"
                    size="md"
                    className="text-sm px-6 py-2"
                  >
                    그룹챗 시작
                  </InteractiveHoverButton>
                </div>
              ) : (
                <>
                  {/* 비디오 그리드 */}
                  <div 
                    className={`grid gap-2 ${getGridClass(participantCount)}`}
                    style={{ minHeight: '200px' }} // 고정 높이
                  >
                    {currentParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`aspect-square bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden ${
                      needsCenterAlignment(index, participantCount) 
                        ? 'col-span-2 w-1/2 mx-auto' 
                        : ''
                    }`}
                  >
                    {/* 임시 플레이스홀더 - 추후 실제 비디오 스트림으로 교체 */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <span className="text-white font-medium">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-300">{participant.name}</span>
                      {participant.isMe && (
                        <span className="text-xs text-orange-400 block">(나)</span>
                      )}
                    </div>
                    
                    {/* TODO: 실제 비디오 스트림 컴포넌트로 교체 */}
                    {/* <video 
                      className="w-full h-full object-cover"
                      autoPlay
                      muted={participant.isMe}
                    /> */}
                  </div>
                    ))}
                  </div>

                  {/* 페이지네이션 (6명 초과시) */}
                  {participantCount > 6 && (
                    <div className="flex justify-center items-center gap-2 mt-3">
                      <button className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center">
                        <ChevronDown size={12} className="text-white rotate-90" />
                      </button>
                      <span className="text-xs text-gray-400">1 / 2</span>
                      <button className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center">
                        <ChevronDown size={12} className="text-white -rotate-90" />
                      </button>
                    </div>
                  )}

                  {/* 컨트롤 버튼 영역 (공간 예약) */}
                  <div className="mt-4 pt-3 border-t border-gray-800">
                    <div className="flex justify-center gap-2">
                      {/* TODO: 실제 화상회의 컨트롤 버튼들로 교체 */}
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-400">🎤</span>
                      </div>
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-400">📹</span>
                      </div>
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">❌</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}