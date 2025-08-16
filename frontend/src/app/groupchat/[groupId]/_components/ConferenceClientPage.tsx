// src/app/[groupId]/_components/ConferenceClientPage.tsx

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { ConferenceLayout } from "@/widgets/video-conference/ConferenceLayout";
import { Lobby } from "@/widgets/video-conference/lobby/ui/Lobby";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { initializeSocketApi, webrtcHandler, chatHandler } from "@/shared/api/socket";
import { setRoomId } from "@/entities/video-conference/session/model/slice";
import { joinRoomThunk } from "@/entities/video-conference/session/model/thunks";

interface ConferenceClientPageProps {
  roomId: string;
}

export const ConferenceClientPage = ({ roomId }: ConferenceClientPageProps) => {
  const dispatch = useAppDispatch();
  const { isInRoom, error, status } = useAppSelector((state) => state.session);
  const isJoining = status === "pending";

  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // Redux에 roomId 설정 (페이지 로드 시)
        dispatch(setRoomId(roomId));
        
        await mediasoupManager.init(dispatch);
        initializeSocketApi(dispatch);
        console.log("✅ All systems initialized successfully.");
      } catch (e) {
        console.error("❌ Failed to initialize systems:", e);
      }
    };

    initializeSystems();

    return () => {
      console.log("🧹 Cleaning up conference page resources...");
      webrtcHandler.leaveRoom();
      chatHandler.leaveChat({ roomId });
    };
  }, [dispatch, roomId]);

  const handleJoin = async (userName: string) => {
    if (roomId && userName) {
      try {
        console.log(`🚀 Joining room: ${roomId}, user: ${userName}`);
        // joinRoomThunk를 사용하여 Redux 상태와 채팅 초기화를 모두 처리
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
