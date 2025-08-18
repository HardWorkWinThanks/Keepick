// entities/user/model/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 사용자 엔티티의 데이터 구조를 정의합니다.
export interface User {
  memberId: number; // 사용자 고유 ID
  email: string; // 이메일 (로그인 시 사용)
  nickname: string; // 닉네임
  provider: string; // 소셜 로그인 제공자
  profileUrl?: string; // 프로필 이미지 URL (선택 사항)
  identificationUrl?: string; // AI 프로필 URL (선택 사항)
}

// Redux 스토어에서 관리할 사용자 상태를 정의합니다.
interface UserState {
  currentUser: User | null; // 현재 로그인된 사용자 정보. 비로그인 시 null.
  isLoading: boolean; // 사용자 정보를 불러오는 중인지 여부
}

// 스토어의 초기 상태를 설정합니다.
const initialState: UserState = {
  currentUser: null,
  isLoading: false,
};

// `createSlice`를 사용하여 사용자 관련 리듀서와 액션을 한번에 생성합니다.
const userSlice = createSlice({
  name: "user", // 슬라이스의 이름
  initialState, // 초기 상태
  reducers: { // 리듀서 로직 정의
    // 로그인 성공 시, 서버로부터 받은 사용자 정보를 스토어에 저장합니다.
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload; // 전달받은 사용자 정보로 상태 업데이트
      state.isLoading = false; // 로딩 상태 종료
    },

    // 로그아웃 시, 스토어에서 사용자 정보를 제거합니다.
    clearUser: (state) => {
      state.currentUser = null;
      state.isLoading = false;
    },

    // 사용자 정보를 비동기적으로 불러올 때 로딩 상태를 설정합니다.
    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // 프로필 정보 등 사용자의 일부 정보만 업데이트할 때 사용합니다.
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        // 기존 사용자 정보에 새로운 정보를 덮어씌웁니다 (병합).
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
});

// 생성된 액션 생성자 함수와 리듀서를 내보냅니다.
export const { setUser, clearUser, setUserLoading, updateUser } =
  userSlice.actions;
export default userSlice.reducer;