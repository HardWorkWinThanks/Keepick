// features/friends/api/friendsApi.ts
import { apiClient, ApiResponse } from "@/shared/api/http"
import type { 
  Friend, 
  SearchedUser, 
  CreateFriendRequest, 
  FriendRequestResponse,
  FriendRequestActionResponse,
  FriendStatus 
} from "@/entities/friends"

export const friendsApi = {
  // 친구 목록 조회 (상태별)
  getFriends: async (status: FriendStatus = "FRIEND"): Promise<Friend[]> => {
    const response = await apiClient.get<ApiResponse<Friend[]>>(
      `/api/friends?status=${status}`
    )
    return response.data.data
  },

  // 닉네임으로 사용자 검색
  searchUserByNickname: async (nickname: string): Promise<SearchedUser> => {
    const response = await apiClient.get<ApiResponse<SearchedUser>>(
      `/api/members?nickname=${encodeURIComponent(nickname)}`
    )
    return response.data.data
  },

  // 친구 요청 보내기
  sendFriendRequest: async (request: CreateFriendRequest): Promise<FriendRequestResponse> => {
    const response = await apiClient.post<ApiResponse<FriendRequestResponse>>(
      "/api/friends",
      request
    )
    return response.data.data
  },

  // 친구 요청 수락
  acceptFriendRequest: async (invitationId: number): Promise<FriendRequestActionResponse> => {
    const response = await apiClient.post<ApiResponse<FriendRequestActionResponse>>(
      `/api/friends/requests/${invitationId}`
    )
    return response.data.data
  },

  // 친구 요청 거절
  rejectFriendRequest: async (invitationId: number): Promise<FriendRequestActionResponse> => {
    const response = await apiClient.delete<ApiResponse<FriendRequestActionResponse>>(
      `/api/friends/requests/${invitationId}`
    )
    return response.data.data
  }
}