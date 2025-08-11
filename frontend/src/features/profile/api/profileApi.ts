// features/profile/api/profileApi.ts
import { apiClient, ApiResponse } from "@/shared/api/http";
import { User } from "@/entities/user/model/userSlice";

interface UserUpdateRequest {
  nickname?: string;
  profileUrl?: string;
  identificationUrl?: string;
}

export const profileApi = {
  // 닉네임 중복 확인 구현 필요
  checkNicknameAvailability: () => {
    console.log("닉네임 중복 확인 기능 필요");
    return undefined;
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
