// features/group-invitation-response/model/useReceivedInvitations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupQueryKeys, GroupManagementApi } from '@/features/group-management'
import { invitationApi } from '@/shared/api/invitation'
import { showSuccessMessage, handleError } from '@/shared/lib'
import type { GroupListItem } from '@/entities/group'

/**
 * 받은 그룹 초대 목록 조회 훅
 */
export function useReceivedInvitations() {
  const queryClient = useQueryClient()
  
  // 받은 초대 목록 조회
  const { 
    data: receivedInvitations = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['groups', 'pending'],
    queryFn: async (): Promise<GroupListItem[]> => {
      // 새로운 API 파라미터로 PENDING 상태 그룹만 조회
      return await GroupManagementApi.getMyGroups('PENDING')
    },
    staleTime: 1 * 60 * 1000, // 1분 캐시
    gcTime: 5 * 60 * 1000, // 5분 가비지 컬렉션
    refetchOnWindowFocus: true, // 윈도우 포커스 시 자동 갱신
  })

  // 초대 수락
  const acceptMutation = useMutation({
    mutationFn: async ({ groupId, invitationId }: { groupId: number; invitationId: number }) => {
      return await invitationApi.acceptGroupInvitation(groupId, invitationId)
    },
    onSuccess: (_, { groupId }) => {
      showSuccessMessage('그룹에 가입되었습니다!')
      
      // 그룹 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
      
      // 그룹 이동은 컴포넌트에서 처리하도록 데이터 반환
      return { groupId }
    },
    onError: (error) => {
      handleError(error, '그룹 가입에 실패했습니다.')
    }
  })

  // 초대 거절
  const rejectMutation = useMutation({
    mutationFn: async ({ groupId, invitationId }: { groupId: number; invitationId: number }) => {
      return await invitationApi.rejectGroupInvitation(groupId, invitationId)
    },
    onSuccess: () => {
      showSuccessMessage('초대를 거절했습니다.')
      
      // 받은 초대 목록만 갱신
      queryClient.invalidateQueries({ queryKey: ['groups', 'pending'] })
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
    },
    onError: (error) => {
      handleError(error, '초대 거절에 실패했습니다.')
    }
  })

  return {
    // 데이터
    receivedInvitations,
    invitationCount: receivedInvitations.length,
    
    // 상태
    isLoading,
    error,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    
    // 액션
    acceptInvitation: acceptMutation.mutateAsync,
    rejectInvitation: rejectMutation.mutate,
    refetch
  }
}