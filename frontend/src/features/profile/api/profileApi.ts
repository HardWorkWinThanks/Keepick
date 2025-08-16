// features/profile/api/profileApi.ts
import { apiClient, ApiResponse } from "@/shared/api/http";
import { User } from "@/entities/user/model/userSlice";

interface UserUpdateRequest {
  nickname?: string;
  profileUrl?: string;
  identificationUrl?: string;
}

interface NicknameCheckResponse {
  available: boolean;
  nickname: string;
}

export const profileApi = {
  // 현재 사용자 정보 조회
  getCurrentUserInfo: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/api/members/me");
    return response.data.data;
  },

  // 닉네임 중복 확인
  checkNicknameAvailability: async (nickname: string): Promise<NicknameCheckResponse> => {
    const response = await apiClient.get<ApiResponse<NicknameCheckResponse>>(
      `/api/members/check-nickname?nickname=${encodeURIComponent(nickname)}`
    );
    return response.data.data;
  },

  // 사용자 정보 업데이트 (모든 필드 지원)
  updateUserInfo: async (updateData: UserUpdateRequest): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>(
      "/api/members/me",
      updateData
    );
    return response.data.data;
  },
};
