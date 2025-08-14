// src/app/[groupId]/_components/ConferenceClientPage.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { ConferenceLayout } from "@/widgets/video-conference/ConferenceLayout";
import { Lobby } from "@/widgets/video-conference/lobby/ui/Lobby";
import { socketApi } from "@/shared/api/socketApi";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { screenShareManager } from "@/shared/api/screenShareManager";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";

interface ConferenceClientPageProps {
  roomId: string;
}

export const ConferenceClientPage = ({ roomId }: ConferenceClientPageProps) => {
  const dispatch = useAppDispatch();
  const { isInRoom, error } = useAppSelector((state) => state.session);
  const isJoining = useAppSelector(
    (state) => state.session.status === "pending"
  );
  const isDeviceLoaded = useAppSelector((state) => state.media.device.loaded);

  useEffect(() => {
    // 새로운 MediaSoup 구조로 초기화
    const initializeMediaSoup = async () => {
      try {
        await mediasoupManager.init(dispatch);
        socketApi.init(dispatch);
        console.log("✅ MediaSoup and Socket initialized");
      } catch (error) {
        console.error("❌ Failed to initialize:", error);
      }
    };

    initializeMediaSoup();

    // 화면 공유 이벤트 리스너 등록
    const handleScreenShareStarted = (event: CustomEvent) => {
      const { producerId, peerId, peerName } = event.detail;
      if (peerId !== socketApi.getSocketId()) {
        screenShareManager.consumeScreenShare(
          roomId,
          producerId,
          peerId,
          peerName || "Unknown User"
        );
      }
    };

    const handleScreenShareStopped = (event: CustomEvent) => {
      const { producerId, peerId } = event.detail;
      screenShareManager.removeRemoteScreenShare(producerId, peerId);
    };

    window.addEventListener(
      "screenShareStarted",
      handleScreenShareStarted as EventListener
    );
    window.addEventListener(
      "screenShareStopped",
      handleScreenShareStopped as EventListener
    );

    return () => {
      window.removeEventListener(
        "screenShareStarted",
        handleScreenShareStarted as EventListener
      );
      window.removeEventListener(
        "screenShareStopped",
        handleScreenShareStopped as EventListener
      );
    };
  }, [dispatch, roomId]);

  // mediasoup device가 로드된 후 화면 공유 매니저 초기화
  useEffect(() => {
    if (isDeviceLoaded && mediasoupManager.getDevice()) {
      screenShareManager.init(dispatch, mediasoupManager.getDevice()!);
    }
  }, [dispatch, isDeviceLoaded]);

  useEffect(() => {
    // 컴포넌트 언마운트 시 방 나가기 처리
    return () => {
      if (isInRoom) {
        mediasoupManager.cleanup();
        socketApi.leaveRoom();
        chatSocketHandler.leaveChat();
        screenShareManager.cleanup();
      }
    };
  }, [dispatch, isInRoom]);

  // 새로운 구조: Lobby에서 받은 스트림 없이 직접 미디어 시작
  const handleJoin = async (stream: MediaStream, userName: string) => {
    if (roomId) {
      try {
        console.log(`🚀 Joining room: ${roomId}, user: ${userName}`);
        
        // 1. 채팅 핸들러 설정
        chatSocketHandler.setRoomInfo(roomId, userName);

        // 2. 방 입장 요청 (새로운 구조에서는 socketApi가 MediaSoup 초기화 처리)
        socketApi.joinRoom({ roomId, userName });
        
      } catch (error) {
        console.error("❌ Failed to join room:", error);
      }
    }
  };

  // 방에 입장하지 않은 경우, Lobby 컴포넌트를 렌더링
  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isJoining} error={error} />;
  }

  // 방에 성공적으로 입장하면 ConferenceLayout을 렌더링
  return <ConferenceLayout />;
};
