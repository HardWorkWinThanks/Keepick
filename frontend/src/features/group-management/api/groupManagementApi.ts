"use client";

import { apiClient } from "@/shared/api/http";
import type { Group, GroupListItem, GroupMember } from "@/entities/group";

// ===== API RESPONSE TYPES =====

interface GroupListResponse {
  status: number;
  message: string;
  data: GroupListItem[];
}

interface CreateGroupRequest {
  name: string;
  description?: string;
  groupThumbnailUrl?: string;
}

interface CreateGroupResponse {
  status: number;
  message: string;
  data: {
    groupId: number;
    name: string;
    createdAt: string;
  };
}

interface GetGroupInfoResponse {
  status: number;
  message: string;
  data: Group;
}

interface UpdateGroupRequest {
  name: string;
  description: string;
  thumbnailUrl: string;
}

interface UpdateGroupResponse {
  status: number;
  message: string;
  data: Group;
}

interface GetGroupMembersResponse {
  status: number;
  message: string;
  data: GroupMember[];
}


// ===== API =====

export const GroupManagementApi = {
  // 그룹 목록 조회 (상태별 필터링 가능)
  async getMyGroups(status?: "PENDING" | "ACCEPTED" | "REJECTED"): Promise<GroupListItem[]> {
    // 파라미터 타입 검증
    if (status && typeof status !== 'string') {
      console.error('getMyGroups: status must be a string', status);
      status = undefined;
    }
    
    // 허용된 값인지 확인
    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      console.error('getMyGroups: invalid status value', status);
      status = undefined;
    }
    
    const queryParam = status ? `?status=${status}` : '';
    const response = await apiClient.get<GroupListResponse>(`/api/groups${queryParam}`);
    
    // 쿼리 파라미터가 없으면 ACCEPTED만 반환 (기존 동작 유지)
    if (!status) {
      const apiGroups = response.data.data.filter(
        (group) => group.invitationStatus === "ACCEPTED"
      );
      return apiGroups;
    }
    
    // 쿼리 파라미터가 있으면 API 응답을 그대로 반환 (서버에서 필터링)
    return response.data.data;
  },

  // 그룹 생성
  async createGroup(
    data: CreateGroupRequest
  ): Promise<CreateGroupResponse["data"]> {
    const response = await apiClient.post<CreateGroupResponse>("/api/groups", data);
    return response.data.data;
  },

  // 그룹 상세 조회
  async getGroupInfo(groupId: number): Promise<Group> {
    // API 호출
    const response = await apiClient.get<GetGroupInfoResponse>(`/api/groups/${groupId}`)
    return response.data.data;
  },
  
  // 그룹 정보 수정
  async updateGroup(
    groupId: number,
    data: UpdateGroupRequest
  ): Promise<Group> {
    const response = await apiClient.put<UpdateGroupResponse>(`/api/groups/${groupId}`, data);
    return response.data.data
  },

  // 그룹 탈퇴
  async deleteGroup(groupId: number): Promise<void> {
    await apiClient.delete(`api/groups/${groupId}/me`);
  },

  // 그룹 내 그룹원 조회
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    
    // API 호출
    const response = await apiClient.get<GetGroupMembersResponse>(`/api/groups/${groupId}/members`)
    return response.data.data
  }

}
