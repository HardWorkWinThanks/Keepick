// features/group-invite/ui/GroupInviteModal.tsx

"use client"

import { useState } from 'react'
import { X, Link, Users, Check, Copy, UserPlus } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/shared/ui/shadcn/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import { ScrollArea } from '@/shared/ui/shadcn/scroll-area'
import { Badge } from '@/shared/ui/shadcn/badge'
import { useGroupInvite } from '../model/useGroupInvite'

interface GroupInviteModalProps {
  groupId: number
  groupName: string
  isOpen: boolean
  onClose: () => void
}

export function GroupInviteModal({ 
  groupId, 
  groupName, 
  isOpen, 
  onClose 
}: GroupInviteModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'friends'>('link')
  
  const {
    friends,
    selectedFriends,
    selectedCount,
    isFriendsLoading,
    isCreatingLink,
    isInviting,
    createInviteLink,
    inviteSelectedFriends,
    toggleFriendSelection,
    toggleAllFriends,
    isFriendSelected,
    canInvite,
    isAlreadyMember
  } = useGroupInvite({ groupId, isOpen })

  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    // 잠시 후 탭 초기화 (애니메이션 고려)
    setTimeout(() => setActiveTab('link'), 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-[#111111] rounded-xl border border-gray-700 shadow-2xl w-full max-w-md mx-4 h-[600px] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">그룹 초대</h2>
            <p className="text-sm text-gray-400 mt-1">{groupName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </Button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6 h-[calc(600px-120px)] flex flex-col">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'link' | 'friends')} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger 
                value="link" 
                className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white"
              >
                <Link size={16} className="mr-2" />
                링크 생성
              </TabsTrigger>
              <TabsTrigger 
                value="friends"
                className="data-[state=active]:bg-[#FE7A25] data-[state=active]:text-white"
              >
                <Users size={16} className="mr-2" />
                친구 초대
              </TabsTrigger>
            </TabsList>

            {/* 링크 생성 탭 */}
            <TabsContent value="link" className="mt-6 flex-1 flex flex-col justify-center">
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
                  <Link size={28} className="text-gray-400" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-white font-medium text-lg">초대 링크 생성</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                    링크를 생성하여 누구든지 그룹에 가입할 수 있도록 할 수 있습니다.
                  </p>
                </div>
                <Button
                  onClick={() => createInviteLink()}
                  disabled={isCreatingLink}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:border-[#FE7A25] hover:bg-[#FE7A25]/10 hover:text-[#FE7A25] transition-all duration-300 hover:scale-105 active:scale-95 group"
                >
                  {isCreatingLink ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                      생성 중...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Copy size={16} className="mr-2 transition-transform duration-300 group-hover:scale-110" />
                      링크 생성 및 복사
                    </div>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* 친구 초대 탭 */}
            <TabsContent value="friends" className="mt-6 flex-1 flex flex-col">
              {isFriendsLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  친구 목록을 불러오는 중...
                </div>
              ) : friends.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-600" />
                  <p>초대할 수 있는 친구가 없습니다.</p>
                  <p className="text-sm mt-2">모든 친구가 이미 그룹에 가입되어 있습니다.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full space-y-4">
                  {/* 헤더 액션 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedFriends.length === friends.length}
                        onCheckedChange={toggleAllFriends}
                      />
                      <label htmlFor="select-all" className="text-sm text-gray-300 cursor-pointer">
                        전체 선택
                      </label>
                    </div>
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="bg-[#FE7A25]/20 text-[#FE7A25]">
                        {selectedCount}명 선택됨
                      </Badge>
                    )}
                  </div>

                  {/* 친구 목록 */}
                  <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden">
                    <ScrollArea className="h-full scroll-area-friends">
                      <div 
                        className="p-2 space-y-2"
                        style={{
                          minHeight: '280px'
                        }}
                      >
                        <style jsx global>{`
                          .scroll-area-friends [data-radix-scroll-area-viewport] {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
                          }
                          .scroll-area-friends [data-radix-scroll-area-viewport]::-webkit-scrollbar {
                            width: 6px;
                          }
                          .scroll-area-friends [data-radix-scroll-area-viewport]::-webkit-scrollbar-track {
                            background: transparent;
                            border-radius: 3px;
                          }
                          .scroll-area-friends [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
                            background: rgba(156, 163, 175, 0.3);
                            border-radius: 3px;
                          }
                          .scroll-area-friends [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb:hover {
                            background: rgba(156, 163, 175, 0.5);
                          }
                        `}</style>
                        {friends.map((friend) => {
                          const isSelected = isFriendSelected(friend.friendId)
                          return (
                            <div
                              key={friend.friendId}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                                isSelected 
                                  ? 'bg-transparent border-[#FE7A25]/60' 
                                  : 'bg-transparent border-transparent hover:bg-gray-800'
                              }`}
                              onClick={() => toggleFriendSelection(friend.friendId)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => {}} // 상위 div onClick에서 처리
                                className={isSelected ? 'data-[state=checked]:bg-[#FE7A25] data-[state=checked]:border-[#FE7A25]' : ''}
                              />
                              
                              <div className={`w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0 transition-all duration-200 ${
                                isSelected ? 'ring-2 ring-[#FE7A25]/50' : ''
                              }`}>
                                <Image
                                  src={friend.profileUrl || "/placeholder/basic_profile.webp"}
                                  alt={`${friend.nickname} 프로필`}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate transition-colors duration-200 ${
                                  isSelected ? 'text-[#FE7A25]' : 'text-white'
                                }`}>
                                  {friend.nickname}
                                </p>
                                <p className={`text-xs truncate transition-colors duration-200 ${
                                  isSelected ? 'text-[#FE7A25]/70' : 'text-gray-400'
                                }`}>
                                  {friend.name}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* 초대 버튼 */}
                  <Button
                    onClick={inviteSelectedFriends}
                    disabled={!canInvite}
                    className="w-full bg-[#FE7A25] hover:bg-[#E85D04] text-white disabled:opacity-50 disabled:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95 group"
                  >
                    {isInviting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        초대 중...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserPlus size={16} className="mr-2 transition-transform duration-300 group-hover:scale-110" />
                        선택한 {selectedCount}명 초대하기
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}