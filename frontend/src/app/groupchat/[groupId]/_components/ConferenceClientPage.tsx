// src/app/[groupId]/_components/ConferenceClientPage.tsx (AI 초기화 부분 수정)

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { ConferenceLayout } from "@/widgets/video-conference/ConferenceLayout";
import { Lobby } from "@/widgets/video-conference/lobby/ui/Lobby";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { initializeSocketApi, webrtcHandler, chatHandler, aiEventHandler } from "@/shared/api/socket";
import { setRoomId } from "@/entities/video-conference/session/model/slice";
import { joinRoomThunk } from "@/entities/video-conference/session/model/thunks";
import { frontendAiProcessor } from "@/shared/api/ai"; // frontendAiProcessor 임포트 유지
import { setAiEnabled } from "@/entities/video-conference/ai/model/aiSlice"; // setAiEnabled 액션 임포트 유지
import { addReaction } from "@/entities/emoji-reaction/model/slice";
import { mapGestureToEmoji, mapEmotionToEmoji, generateReactionId } from "@/shared/utils/aiEmojiMapper";
import type { GestureResult, EmotionResult } from "@/shared/types/ai.types";


interface ConferenceClientPageProps {
  roomId: string;
}

export const ConferenceClientPage = ({ roomId }: ConferenceClientPageProps) => {
  const dispatch = useAppDispatch();
  const { isInRoom, error, status, userName } = useAppSelector((state) => state.session);
  const aiState = useAppSelector((state) => state.ai);
  const isJoining = status === "pending";

  useEffect(() => {
    const initializeSystems = async () => {
      try {
        dispatch(setRoomId(roomId));
        await mediasoupManager.init(dispatch);
        initializeSocketApi(dispatch);

        // AI 이벤트 핸들러 설정
        console.log("🚀 Setting up AI handlers...");
        aiEventHandler.setRoomId(roomId);
        
        // 실제 사용자 정보 설정
        aiEventHandler.setUserInfo("local", userName || "익명");

        // AI 콜백 설정 (화상회의용)
        frontendAiProcessor.setGestureCallback((result: GestureResult) => {
          console.log("🤖 Conference Gesture Result:", result);
          
          // 정적 제스처 처리 (임계값 낮춤)
          if (result.static && result.static.label !== "none" && result.static.confidence > 0.3) {
            const emoji = mapGestureToEmoji(result.static.label);
            const reaction = {
              id: generateReactionId(),
              emoji,
              userId: "local",
              userName: userName || "익명",
              timestamp: Date.now(),
              duration: 2000,
              source: 'ai' as const,
              aiType: 'gesture' as const,
              confidence: result.static.confidence
            };
            
            dispatch(addReaction(reaction));
            aiEventHandler.sendAiReaction(reaction);
            console.log("✅ Static gesture reaction added:", reaction);
          }
          
          // 동적 제스처 처리 (임계값 낮춤)
          if (result.dynamic && result.dynamic.label !== "none" && result.dynamic.confidence > 0.3) {
            const emoji = mapGestureToEmoji(result.dynamic.label);
            const reaction = {
              id: generateReactionId(),
              emoji,
              userId: "local",
              userName: userName || "익명",
              timestamp: Date.now(),
              duration: 2000,
              source: 'ai' as const,
              aiType: 'gesture' as const,
              confidence: result.dynamic.confidence
            };
            
            dispatch(addReaction(reaction));
            aiEventHandler.sendAiReaction(reaction);
            console.log("✅ Dynamic gesture reaction added:", reaction);
          }
        });

        frontendAiProcessor.setEmotionCallback((result: EmotionResult) => {
          console.log("😊 Conference Emotion Result:", result);
          
          if (result.label !== "none" && result.confidence > 0.3) {
            const emoji = mapEmotionToEmoji(result.label);
            const reaction = {
              id: generateReactionId(),
              emoji,
              userId: "local",
              userName: userName || "익명",
              timestamp: Date.now(),
              duration: 2500,
              source: 'ai' as const,
              aiType: 'emotion' as const,
              confidence: result.confidence
            };
            
            dispatch(addReaction(reaction));
            aiEventHandler.sendAiReaction(reaction);
            console.log("✅ Emotion reaction added:", reaction);
          }
        });
        
        console.log("✅ AI handlers set up successfully.");
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
      aiEventHandler.cleanup();
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
