// shared/api/userApi.ts
import { apiClient, ApiResponse } from "@/shared/api/http";
import { User } from "@/entities/user/model/userSlice";

/**
 * 사용자 정보 관련 공통 API
 * - 중복 요청 방지를 위해 단일 API 엔드포인트 사용
 * - authApi.getCurrentUser와 profileApi.getCurrentUserInfo를 통합
 */
export const userApi = {
  /**
   * 현재 로그인된 사용자의 정보를 서버로부터 가져옵니다.
   * @returns 사용자 정보 Promise
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/api/members/me");
    return response.data.data;
  },
};

/**
 * TanStack Query용 쿼리 키
 */
export const userQueryKeys = {
  all: ['user'] as const,
  current: () => [...userQueryKeys.all, 'me'] as const,
};