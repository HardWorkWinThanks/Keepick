"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GroupManagementApi } from "../api/groupManagementApi"
import { handleGroupError, showSuccessMessage } from "@/shared/lib"
import type { Group, GroupListItem, GroupMember } from "@/entities/group"

// Query Keys
export const groupQueryKeys = {
  all: ['groups'] as const,
  lists: () => [...groupQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...groupQueryKeys.lists(), { filters }] as const,
  details: () => [...groupQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...groupQueryKeys.details(), id] as const,
  members: (id: number) => [...groupQueryKeys.all, 'members', id] as const,
}

/**
 * 그룹 관리를 위한 커스텀 훅 모음
 */
export function useGroupManagement() {
  const queryClient = useQueryClient()

  // 내 그룹 목록 조회 (캐싱)
  const useMyGroups = () => {
    return useQuery({
      queryKey: groupQueryKeys.lists(),
      queryFn: () => GroupManagementApi.getMyGroups(),
      staleTime: 1 * 60 * 1000, // 1분으로 단축 (더 자주 업데이트)
      gcTime: 5 * 60 * 1000, // 5분 가비지 컬렉션
      refetchOnWindowFocus: true, // 윈도우 포커스 시 자동 리패치
      refetchOnReconnect: true, // 네트워크 재연결 시 자동 리패치
    })
  }

  // 그룹 상세 정보 조회 (캐싱)
  const useGroupInfo = (groupId: number) => {
    return useQuery({
      queryKey: groupQueryKeys.detail(groupId),
      queryFn: () => GroupManagementApi.getGroupInfo(groupId),
      staleTime: 10 * 60 * 1000, // 10분 캐시
      gcTime: 30 * 60 * 1000, // 30분 가비지 컬렉션
      enabled: !!groupId, // groupId가 있을 때만 실행
    })
  }

  // 그룹 멤버 조회 (캐싱)
  const useGroupMembers = (groupId: number) => {
    return useQuery({
      queryKey: groupQueryKeys.members(groupId),
      queryFn: () => GroupManagementApi.getGroupMembers(groupId),
      staleTime: 5 * 60 * 1000, // 5분 캐시
      enabled: !!groupId,
    })
  }

  // 그룹 생성 (낙관적 업데이트)
  const createGroupMutation = useMutation({
    mutationFn: GroupManagementApi.createGroup,
    onSuccess: (newGroup) => {
      // 성공 메시지 표시
      showSuccessMessage('그룹 생성 완료', `'${newGroup.name}' 그룹이 생성되었습니다.`)
      
      // 그룹 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
      
      // 새 그룹을 목록에 낙관적으로 추가
      queryClient.setQueryData<GroupListItem[]>(
        groupQueryKeys.lists(), 
        (old) => old ? [...old, {
          groupId: newGroup.groupId,
          name: newGroup.name,
          memberCount: 1,
          invitationId: 0,
          invitationStatus: "ACCEPTED",
          thumbnailUrl: undefined, // 새 그룹은 썸네일이 없음
          createdAt: newGroup.createdAt
        }] : undefined
      )
    },
    onError: (error) => {
      handleGroupError(error, '생성')
      // 에러 발생 시 캐시 무효화로 정확한 데이터 다시 가져오기
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
    }
  })

  // 그룹 수정 (낙관적 업데이트)
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: any }) => 
      GroupManagementApi.updateGroup(groupId, data),
    onMutate: async ({ groupId, data }) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: groupQueryKeys.detail(groupId) })
      
      // 이전 데이터 백업
      const previousGroup = queryClient.getQueryData<Group>(groupQueryKeys.detail(groupId))
      
      // 낙관적 업데이트
      if (previousGroup) {
        queryClient.setQueryData<Group>(
          groupQueryKeys.detail(groupId), 
          { ...previousGroup, ...data }
        )
      }
      
      return { previousGroup }
    },
    onSuccess: (updatedGroup) => {
      showSuccessMessage('그룹 정보 수정 완료', '그룹 정보가 성공적으로 수정되었습니다.')
    },
    onError: (error, variables, context) => {
      handleGroupError(error, '수정')
      
      // 에러 시 이전 데이터로 롤백
      if (context?.previousGroup) {
        queryClient.setQueryData(
          groupQueryKeys.detail(variables.groupId),
          context.previousGroup
        )
      }
    },
    onSettled: (_, __, { groupId }) => {
      // 성공/실패 관계없이 해당 그룹 데이터 다시 가져오기
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.detail(groupId) })
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
    }
  })

  // 그룹 탈퇴
  const deleteGroupMutation = useMutation({
    mutationFn: GroupManagementApi.deleteGroup,
    onSuccess: (_, groupId) => {
      showSuccessMessage('그룹 탈퇴 완료', '그룹이 성공적으로 삭제되었습니다.')
      
      // 관련 캐시 모두 무효화
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
      queryClient.removeQueries({ queryKey: groupQueryKeys.detail(groupId) })
      queryClient.removeQueries({ queryKey: groupQueryKeys.members(groupId) })
    },
    onError: (error) => {
      handleGroupError(error, '삭제')
    }
  })

  return {
    // 조회 훅들
    useMyGroups,
    useGroupInfo,
    useGroupMembers,
    
    // 변경 훅들
    createGroup: createGroupMutation,
    updateGroup: updateGroupMutation,
    deleteGroup: deleteGroupMutation,
    
    // 유틸리티
    invalidateGroupQueries: (groupId?: number) => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: groupQueryKeys.detail(groupId) })
        queryClient.invalidateQueries({ queryKey: groupQueryKeys.members(groupId) })
      }
      queryClient.invalidateQueries({ queryKey: groupQueryKeys.lists() })
    }
  }
}

/**
 * 간편한 그룹 조회 훅들 (개별 사용 가능)
 */
export const useMyGroups = () => {
  return useQuery({
    queryKey: groupQueryKeys.lists(),
    queryFn: GroupManagementApi.getMyGroups,
    staleTime: 1 * 60 * 1000, // 1분으로 단축 (더 자주 업데이트)
    gcTime: 5 * 60 * 1000, // 5분 가비지 컬렉션  
    refetchOnWindowFocus: true, // 윈도우 포커스 시 자동 리패치
    refetchOnReconnect: true, // 네트워크 재연결 시 자동 리패치
  })
}

export const useGroupInfo = (groupId: number) => {
  return useQuery({
    queryKey: groupQueryKeys.detail(groupId),
    queryFn: () => GroupManagementApi.getGroupInfo(groupId),
    staleTime: 10 * 60 * 1000, // 10분 캐시
    gcTime: 30 * 60 * 1000, // 30분 가비지 컬렉션  
    enabled: !!groupId,
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리패치 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시에만 리패치
  })
}

export const useGroupMembers = (groupId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: groupQueryKeys.members(groupId),
    queryFn: () => GroupManagementApi.getGroupMembers(groupId),
    staleTime: 5 * 60 * 1000, // 5분 캐시
    gcTime: 15 * 60 * 1000, // 15분 가비지 컬렉션
    enabled: options?.enabled !== undefined ? options.enabled && !!groupId : !!groupId,
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리패치 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시에만 리패치
  })
}