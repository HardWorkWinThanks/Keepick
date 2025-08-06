// features/auth/model/types.ts

/**
 * Redux 스토어의 `auth` 슬라이스에서 관리하는 상태의 타입을 정의합니다.
 * 이 상태는 사용자 자체의 데이터가 아닌, 인증 과정과 관련된 정보만을 포함합니다.
 */
export interface AuthState {
  isAuthenticated: boolean; // 현재 사용자가 로그인(인증)된 상태인지 여부
  accessToken: string | null; // 서버 API에 접근하기 위한 JWT 액세스 토큰
  refreshToken: string | null; // Access Token을 갱신하기 위한 JWT 리프레시 토큰
  isLoading: boolean; // 로그인, 로그아웃, 토큰 갱신 등 비동기 인증 처리가 진행 중인지 여부
}
