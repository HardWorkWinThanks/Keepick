// features/auth/api/authApi.ts
import { apiClient } from "@/shared/api/http";
import { TokenRefreshResponse, UserResponse } from "./types";

/**
 * 인증(Authentication)과 관련된 모든 서버 API 요청을 관리하는 객체입니다.
 */
export const authApi = {
  /**
   * 현재 로그인된 사용자의 정보를 서버로부터 가져옵니다.
   * @returns 사용자 정보 응답 Promise
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>("/api/members/me");
    return response.data;
  },

  /**
   * 만료된 Access Token을 Refresh Token을 사용하여 갱신합니다.
   * @param refreshToken - 사용자가 가진 Refresh Token
   * @returns 새로운 Access Token과 Refresh Token(선택적)을 포함하는 응답 Promise
   * @note apiClient를 사용하지 않는 이유는, apiClient의 요청 인터셉터가 이 함수를 호출하여
   *       무한 순환 참조에 빠질 수 있기 때문입니다.
   */
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    return response.json();
  },

  /**
   * 서버에 로그아웃 요청을 보냅니다.
   * (서버 측 세션/토큰 무효화를 위해 사용될 수 있습니다.)
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/api/logout");
  },
};