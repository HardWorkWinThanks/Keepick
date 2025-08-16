// features/friends/model/useFriends.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { friendsApi } from "../api/friendsApi"
import type { FriendStatus, CreateFriendRequest } from "@/entities/friends"

// 쿼리 키 상수
const QUERY_KEYS = {
  friends: (status: FriendStatus) => ["friends", status],
  searchUser: (nickname: string) => ["searchUser", nickname]
} as const

export function useFriends() {
  const queryClient = useQueryClient()

  // 친구 목록 조회 (상태별)
  const useFriendsList = (status: FriendStatus = "FRIEND") => {
    return useQuery({
      queryKey: QUERY_KEYS.friends(status),
      queryFn: () => friendsApi.getFriends(status),
      staleTime: 5 * 60 * 1000, // 5분
    })
  }

  // 닉네임으로 사용자 검색
  const useSearchUser = (nickname: string, enabled: boolean = false) => {
    return useQuery({
      queryKey: QUERY_KEYS.searchUser(nickname),
      queryFn: () => friendsApi.searchUserByNickname(nickname),
      enabled: enabled && nickname.trim().length > 0,
      retry: false, // 404 에러시 재시도 안함
    })
  }

  // 친구 요청 보내기
  const useSendFriendRequest = () => {
    return useMutation({
      mutationFn: (request: CreateFriendRequest) => friendsApi.sendFriendRequest(request),
      onSuccess: () => {
        // 보낸 친구 요청 목록 갱신
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends("SENT") })
      },
    })
  }

  // 친구 요청 수락
  const useAcceptFriendRequest = () => {
    return useMutation({
      mutationFn: (invitationId: number) => friendsApi.acceptFriendRequest(invitationId),
      onSuccess: () => {
        // 친구 목록과 받은 요청 목록 갱신
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends("FRIEND") })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends("RECEIVED") })
      },
    })
  }

  // 친구 요청 거절
  const useRejectFriendRequest = () => {
    return useMutation({
      mutationFn: (invitationId: number) => friendsApi.rejectFriendRequest(invitationId),
      onSuccess: () => {
        // 받은 요청 목록 갱신
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends("RECEIVED") })
      },
    })
  }

  return {
    useFriendsList,
    useSearchUser,
    useSendFriendRequest,
    useAcceptFriendRequest,
    useRejectFriendRequest,
  }
}