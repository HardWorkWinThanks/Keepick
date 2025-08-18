// features/group-invite/model/useGroupInvite.ts

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invitationApi } from '@/shared/api/invitation'
import { friendsApi } from '@/features/friends/api/friendsApi'
import { useGroupMembers } from '@/features/group-management'
import { copyInvitationLink, showSuccessMessage, handleError } from '@/shared/lib'
import type { GroupInviteRequest } from '@/entities/invitation'
import type { Friend } from '@/entities/friends'

interface UseGroupInviteProps {
  groupId: number
  isOpen: boolean
}

export function useGroupInvite({ groupId, isOpen }: UseGroupInviteProps) {
  const queryClient = useQueryClient()
  const [selectedFriends, setSelectedFriends] = useState<number[]>([])

  // 그룹 멤버 목록 조회 (이미 가입한 친구 체크용)
  const { data: groupMembers = [] } = useGroupMembers(groupId, {
    enabled: isOpen && groupId > 0
  })

  // 친구 목록 조회
  const { 
    data: friends = [], 
    isLoading: isFriendsLoading 
  } = useQuery({
    queryKey: ['friends', 'accepted'],
    queryFn: () => friendsApi.getFriends('FRIEND'),
    enabled: isOpen,
    staleTime: 3 * 60 * 1000, // 3분 캐시
  })

  // 초대 링크 생성
  const linkMutation = useMutation({
    mutationFn: () => invitationApi.createInvitationLink(groupId),
    onSuccess: async (data) => {
      const success = await copyInvitationLink(data.link)
      if (success) {
        showSuccessMessage('초대 링크가 클립보드에 복사되었습니다!')
      } else {
        showSuccessMessage(`초대 링크: ${data.link}`)
      }
    },
    onError: (error) => {
      handleError(error, '초대 링크 생성에 실패했습니다.')
    }
  })

  // 친구 초대
  const inviteMutation = useMutation({
    mutationFn: (request: GroupInviteRequest) => 
      invitationApi.inviteFriendsToGroup(groupId, request),
    onSuccess: (data) => {
      showSuccessMessage(`${data.length}명의 친구에게 초대를 보냈습니다!`)
      setSelectedFriends([]) // 선택 초기화
      
      // 받은 초대 목록 갱신 (초대받은 사람들의 화면에서)
      queryClient.invalidateQueries({ queryKey: ['groups', 'pending'] })
    },
    onError: (error) => {
      handleError(error, '친구 초대에 실패했습니다.')
    }
  })

  // 이미 그룹에 가입된 친구인지 체크
  const isAlreadyMember = (friendId: number): boolean => {
    return groupMembers.some(member => member.memberId === friendId)
  }

  // 초대 가능한 친구 목록 (이미 가입하지 않은 친구들)
  const availableFriends = friends.filter(friend => !isAlreadyMember(friend.friendId))

  // 친구 선택/해제
  const toggleFriendSelection = (friendId: number) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  // 전체 선택/해제
  const toggleAllFriends = () => {
    if (selectedFriends.length === availableFriends.length) {
      setSelectedFriends([])
    } else {
      setSelectedFriends(availableFriends.map(friend => friend.friendId))
    }
  }

  // 선택된 친구들 초대
  const inviteSelectedFriends = () => {
    if (selectedFriends.length === 0) {
      handleError(new Error('초대할 친구를 선택해주세요.'), '초대할 친구를 선택해주세요.')
      return
    }
    
    inviteMutation.mutate({ inviteeIds: selectedFriends })
  }

  return {
    // 데이터
    friends: availableFriends,
    groupMembers,
    selectedFriends,
    selectedCount: selectedFriends.length,
    
    // 상태
    isFriendsLoading,
    isCreatingLink: linkMutation.isPending,
    isInviting: inviteMutation.isPending,
    
    // 액션
    createInviteLink: linkMutation.mutate,
    inviteSelectedFriends,
    toggleFriendSelection,
    toggleAllFriends,
    setSelectedFriends,
    
    // 헬퍼
    isAlreadyMember,
    isFriendSelected: (friendId: number) => selectedFriends.includes(friendId),
    canInvite: selectedFriends.length > 0 && !inviteMutation.isPending
  }
}