// src/shared/api/socket/index.ts

import { AppDispatch } from "@/shared/config/store";
import { socketManager } from './socketManager';
import { webrtcHandler } from './webrtcHandler';
import { chatHandler } from './chatHandler';
import { gestureHandler } from './gestureHandler';
import { aiEventHandler } from './aiEventHandler';

// 전체 소켓 관련 기능을 초기화하는 함수
export function initializeSocketApi(dispatch: AppDispatch) {
  socketManager.init(dispatch, [
    webrtcHandler,
    chatHandler,
    gestureHandler,
  ]);
  
  // AI 이벤트 핸들러 별도 초기화
  const socket = socketManager.getSocket();
  if (socket) {
    aiEventHandler.init(socket, dispatch);
  }
}

// 외부에서 사용할 핸들러들을 export
export {
  socketManager,
  webrtcHandler,
  chatHandler,
  gestureHandler,
  aiEventHandler,
};
