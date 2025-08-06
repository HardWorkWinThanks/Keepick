// features/auth/api/types.ts

/**
 * Access Token 갱신 API(refreshToken)의 성공 응답 타입을 정의합니다.
 */
export interface TokenRefreshResponse {
  accessToken: string; // 새로 발급된 Access Token
  refreshToken?: string; // 경우에 따라 새로 발급될 수 있는 Refresh Token (선택적)
}

/**
 * 사용자 정보 조회 API(getCurrentUser)의 성공 응답 타입을 정의합니다.
 */
export interface UserResponse {
  status: number;
  message: string;
  data: {
    memberId: number;
    email: string;
    nickname: string;
    profileUrl?: string;
    provider: string;
    identificationUrl?: string;
  };
}
