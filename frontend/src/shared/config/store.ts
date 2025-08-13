import { configureStore } from "@reduxjs/toolkit";

// 1. 필요한 모든 리듀서를 한 곳으로 가져옵니다.
import authReducer from "@/features/auth/model/authSlice"; // 경로 확인 필요
import { userReducer } from "@/entities/user"; // 경로 확인 필요
import sessionReducer from "@/entities/video-conference/session/model/slice";
import mediaReducer from "@/entities/video-conference/media/model/slice";
import webrtcReducer from "@/entities/video-conference/webrtc/model/slice";
import gestureReducer from "@/entities/video-conference/gesture/model/slice";

// 스토어를 생성하는 makeStore 함수
export const makeStore = () => {
  return configureStore({
    // 2. reducer 객체 안에 모든 리듀서를 등록합니다.
    reducer: {
      auth: authReducer,
      user: userReducer,
      session: sessionReducer,
      media: mediaReducer,
      webrtc: webrtcReducer,
      gesture: gestureReducer,
    },
    // 3. 두 개의 미들웨어 설정을 하나로 합칩니다.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // persist와 화상회의 관련 액션을 모두 무시하도록 설정
          ignoredActions: ["persist/PERSIST"],
          ignoredActionPaths: ["payload.stream", "payload.track"],
          ignoredPaths: ["session.localStream", "webrtc.remoteStreams"],
        },
      }),
    devTools: true, // devTools 활성화 유지
  });
};

// 타입 정의는 그대로 유지합니다.
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
