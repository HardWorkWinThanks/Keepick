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
  // 그룹 목록 조회 (가입된 그룹만)
  async getMyGroups(): Promise<GroupListItem[]> {
    
      const response = await apiClient.get<GroupListResponse>("/api/groups");
      // ACCEPTED 상태인 그룹만 필터링
      const apiGroups = response.data.data.filter(
        (group) => group.invitationStatus === "ACCEPTED"
      );
      // API 그룹과 더미 그룹을 합쳐서 반환
      return apiGroups;
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
    // // 더미 데이터 확인
    // if (DUMMY_GROUP_DETAILS[groupId]) {
    //   console.log(`더미 그룹 정보 반환: ${groupId}`);
    //   return DUMMY_GROUP_DETAILS[groupId];
    // }
    
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
