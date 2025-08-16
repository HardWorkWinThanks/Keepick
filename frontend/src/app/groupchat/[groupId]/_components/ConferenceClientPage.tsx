// src/app/[groupId]/_components/ConferenceClientPage.tsx (AI 초기화 부분 수정)

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { ConferenceLayout } from "@/widgets/video-conference/ConferenceLayout";
import { Lobby } from "@/widgets/video-conference/lobby/ui/Lobby";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { initializeSocketApi, webrtcHandler, chatHandler } from "@/shared/api/socket";
import { setRoomId } from "@/entities/video-conference/session/model/slice";
import { joinRoomThunk } from "@/entities/video-conference/session/model/thunks";
import { frontendAiProcessor } from "@/shared/api/ai"; // frontendAiProcessor 임포트 유지
import { setAiEnabled } from "@/entities/video-conference/ai/model/aiSlice"; // setAiEnabled 액션 임포트 유지

// Note: 이 파일에서는 aiSystemInitialized 플래그를 사용하지 않습니다.
// AIProcessorInitializer.tsx에서 전역적으로 AI 시스템 초기화를 담당합니다.

interface ConferenceClientPageProps {
  roomId: string;
}

export const ConferenceClientPage = ({ roomId }: ConferenceClientPageProps) => {
  const dispatch = useAppDispatch();
  const { isInRoom, error, status } = useAppSelector((state) => state.session);
  const aiState = useAppSelector((state) => state.ai);
  const isJoining = status === "pending";

  useEffect(() => {
    const initializeSystems = async () => {
      try {
        dispatch(setRoomId(roomId));
        await mediasoupManager.init(dispatch);
        initializeSocketApi(dispatch);

        // AI 시스템 초기화는 AIProcessorInitializer에서 담당하므로 여기서는 제거합니다.
        // 대신 AI 관련 콜백만 설정합니다.
        console.log("🚀 Setting up AI Callbacks (from ConferenceClientPage)...");
        frontendAiProcessor.setGestureCallback((result) => {
          // TODO: 이 결과를 Redux 등으로 전달하여 상태를 업데이트합니다.
          // 예: dispatch(addDetectedGesture(result));
          console.log("Gesture Result (from ConferenceClientPage):", result);
        });
        frontendAiProcessor.setEmotionCallback((result) => {
          // TODO: 이 결과를 Redux 등으로 전달하여 상태를 업데이트합니다.
          // 예: dispatch(addDetectedEmotion(result));
          console.log("Emotion Result (from ConferenceClientPage):", result);
        });
        console.log("✅ AI Callbacks set up successfully.");
      } catch (e) {
        console.error("❌ Failed to initialize systems:", e);
        // TODO: UI에 에러 메시지를 표시하는 로직 추가
      }
    };

    initializeSystems();

    return () => {
      console.log("🧹 Cleaning up conference page resources...");
      webrtcHandler.leaveRoom();
      chatHandler.leaveChat({ roomId });
      // AI 시스템 클린업은 AIProcessorInitializer에서 담당하므로 여기서는 제거합니다.
      // 회의 종료 시 AI 상태만 비활성화합니다.
      dispatch(setAiEnabled(false));
    };
  }, [dispatch, roomId]);

  const handleJoin = async (userName: string) => {
    if (roomId && userName) {
      try {
        console.log(`🚀 Joining room: ${roomId}, user: ${userName}`);
        dispatch(joinRoomThunk({ roomId, userName }));
      } catch (e) {
        console.error("❌ Failed to join room:", e);
      }
    }
  };

  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isJoining} error={error} />;
  }

  return <ConferenceLayout />;
};
