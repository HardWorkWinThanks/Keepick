// shared/api/invitation/invitationApi.ts

import { apiClient } from "@/shared/api/http"
import type { 
  InvitationApiResponse,
  InvitationLinkResponse,
  GroupInviteRequest,
  GroupInviteResponse,
  Invitation
} from "@/entities/invitation"

export const invitationApi = {
  /**
   * 그룹 초대 링크 생성
   * @param groupId 그룹 ID
   * @returns 초대 링크 (https://i13d207.p.ssafy.io/invite/abc123 형태)
   */
  async createInvitationLink(groupId: number): Promise<InvitationLinkResponse> {
    const response = await apiClient.post<InvitationApiResponse<InvitationLinkResponse>>(
      `/api/groups/${groupId}/invitation-link`
    )
    return response.data.data
  },

  /**
   * 그룹 초대 링크로 그룹 가입
   * @param groupId 그룹 ID
   * @param invitationToken 초대 토큰 (Base64 디코딩된 token 값)
   * @returns 생성된 초대 정보
   */
  async joinGroupByLink(groupId: number, invitationToken: string): Promise<Invitation> {
    const response = await apiClient.get<InvitationApiResponse<Invitation>>(
      `/api/groups/${groupId}/invitation-link/${invitationToken}`
    )
    return response.data.data
  },

  /**
   * 그룹 초대 요청 (친구들 초대)
   * @param groupId 그룹 ID
   * @param request 초대할 친구들의 ID 배열
   * @returns 생성된 초대 목록
   */
  async inviteFriendsToGroup(
    groupId: number, 
    request: GroupInviteRequest
  ): Promise<GroupInviteResponse[]> {
    const response = await apiClient.post<InvitationApiResponse<GroupInviteResponse[]>>(
      `/api/groups/${groupId}/invitations`,
      request
    )
    return response.data.data
  },

  /**
   * 그룹 초대 수락
   * @param groupId 그룹 ID
   * @param invitationId 초대 ID
   * @returns 업데이트된 초대 정보
   */
  async acceptGroupInvitation(groupId: number, invitationId: number): Promise<Invitation> {
    console.log(`API 호출: 그룹 초대 수락 - groupId=${groupId}, invitationId=${invitationId}`)
    
    try {
      const response = await apiClient.post<InvitationApiResponse<Invitation>>(
        `/api/groups/${groupId}/invitations/${invitationId}`
      )
      
      console.log('그룹 초대 수락 API 응답:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      })
      
      return response.data.data
    } catch (error) {
      console.error('그룹 초대 수락 API 에러:', {
        error,
        groupId,
        invitationId,
        url: `/api/groups/${groupId}/invitations/${invitationId}`
      })
      throw error
    }
  },

  /**
   * 그룹 초대 거절
   * @param groupId 그룹 ID
   * @param invitationId 초대 ID
   * @returns 업데이트된 초대 정보
   */
  async rejectGroupInvitation(groupId: number, invitationId: number): Promise<Invitation> {
    const response = await apiClient.delete<InvitationApiResponse<Invitation>>(
      `/api/groups/${groupId}/invitations/${invitationId}`
    )
    return response.data.data
  }
}