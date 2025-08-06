// features/auth/model/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "./types";

// 인증 상태의 초기값을 정의합니다.
const initialState: AuthState = {
  isAuthenticated: false, // 로그인 여부
  accessToken: null, // 서버 API 접근에 사용하는 토큰
  refreshToken: null, // Access Token 갱신에 사용하는 토큰
  isLoading: false, // 로그인/로그아웃 처리 중인지 여부
};

// `createSlice`를 사용하여 인증 관련 리듀서와 액션을 생성합니다.
const authSlice = createSlice({
  name: "auth", // 슬라이스 이름
  initialState,
  reducers: {
    // 로그인 성공 시, 서버로부터 받은 토큰들을 스토어에 저장합니다.
    setTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string; // Refresh Token은 선택적으로 받을 수 있음
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true; // 인증 상태로 변경

      // 웹 브라우저의 localStorage에 accessToken을 저장하여, 새로고침해도 로그인 상태를 유지합니다.
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
      }

      // Refresh Token이 있는 경우 함께 저장합니다.
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
      }
    },

    // Access Token이 만료되어 새로 발급받았을 때, 스토어의 토큰을 업데이트합니다.
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload);
      }
    },

    // 로그아웃 시, 스토어와 localStorage에서 모든 인증 정보를 제거합니다.
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.isLoading = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },

    // 비동기 인증 처리(로그인, 토큰 갱신 등) 시 로딩 상태를 설정합니다.
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

// 생성된 액션 생성자 함수와 리듀서를 내보냅니다.
export const { setTokens, updateAccessToken, clearAuth, setAuthLoading } =
  authSlice.actions;
export default authSlice.reducer;