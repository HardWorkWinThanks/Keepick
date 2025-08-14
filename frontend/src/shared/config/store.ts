//src/shared/config/store.ts
import { configureStore } from "@reduxjs/toolkit";

// 1. 필요한 모든 리듀서를 한 곳으로 가져옵니다.
import authReducer from "@/features/auth/model/authSlice"; // 경로 확인 필요
import { userReducer } from "@/entities/user"; // 경로 확인 필요
import sessionReducer from "@/entities/video-conference/session/model/slice";
import re_mediaReducer from "@/entities/video-conference/media/model/slice";
import mediaReducer from "@/entities/video-conference/media/model/mediaSlice"

import webrtcReducer from "@/entities/video-conference/webrtc/model/slice";
import gestureReducer from "@/entities/video-conference/gesture/model/slice";
import { chatReducer } from "@/entities/chat/model/slice"; // 채팅 상태
import { emojiReactionReducer } from "@/entities/emoji-reaction/model/slice"; // 이모지 반응 상태
import { screenShareReducer } from "@/entities/screen-share/model/slice"; // 화면 공유 상태

// 스토어를 생성하는 makeStore 함수
export const makeStore = () => {
  return configureStore({
    // 2. reducer 객체 안에 모든 리듀서를 등록합니다.
    reducer: {
      auth: authReducer,
      user: userReducer,
      session: sessionReducer,
      media: mediaReducer,
      re_media: re_mediaReducer,
      webrtc: webrtcReducer,
      gesture: gestureReducer,
      chat: chatReducer, // 채팅 상태 추가
      emojiReaction: emojiReactionReducer, // 이모지 반응 상태 추가
      screenShare: screenShareReducer, // 화면 공유 상태 추가
    },
    // 3. 두 개의 미들웨어 설정을 하나로 합칩니다.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // persist와 화상회의, 채팅, 이모지, 화면공유 관련 액션을 모두 무시하도록 설정
          ignoredActions: ["persist/PERSIST"],
          ignoredActionPaths: [
            "payload.stream",
            "payload.track",
            "payload.timestamp",
            "payload.startedAt",
          ],
          ignoredPaths: [
            "session.localStream",
            "webrtc.remoteStreams",
            "chat.messages",
            "emojiReaction.reactionHistory",
            "screenShare.localScreenShare.startedAt",
            "screenShare.remoteScreenShares",
          ],
        },
      }),
    devTools: true, // devTools 활성화 유지
  });
};

// 타입 정의는 그대로 유지합니다.
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
