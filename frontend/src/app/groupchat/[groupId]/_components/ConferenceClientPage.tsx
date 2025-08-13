// src/app/[groupId]/_components/ConferenceClientPage.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import {
  joinRoomThunk,
  leaveRoomThunk,
} from "@/entities/video-conference/session/model/thunks";
import {
  consumeNewProducerThunk,
  handleProducerClosedThunk,
} from "@/entities/video-conference/consume-stream/model/thunks";
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
  const isDeviceLoaded = useAppSelector((state) => state.webrtc.isDeviceLoaded);

  useEffect(() => {
    // 소켓 및 매니저들 초기화
    socketApi.init(
      dispatch,
      (params) => dispatch(consumeNewProducerThunk(params)),
      (params) => dispatch(handleProducerClosedThunk(params))
    );
    mediasoupManager.init(dispatch);

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
        dispatch(leaveRoomThunk());
        chatSocketHandler.leaveChat();
        screenShareManager.cleanup();
      }
    };
  }, [dispatch, isInRoom]);

  // [수정] onJoin 핸들러가 userName을 받도록 시그니처 변경
  const handleJoin = (stream: MediaStream, userName: string) => {
    if (roomId) {
      // 1. Lobby에서 받아온 스트림을 mediasoupManager에 저장
      mediasoupManager.setLocalStream(stream);

      // 2. [제거] 임시 사용자 이름 생성 로직 제거
      // const tempUserName = `User_${Math.random().toString(36).substring(7)}`;

      // 3. [수정] 채팅 핸들러에 전달받은 userName 설정
      chatSocketHandler.setRoomInfo(roomId, userName);

      // 4. [수정] Thunk에 전달받은 userName 사용
      console.log(`[1] Thunk 출발! roomId: ${roomId}, userName: ${userName}`);
      dispatch(joinRoomThunk({ roomId, userName: userName }));
    }
  };

  // 방에 입장하지 않은 경우, Lobby 컴포넌트를 렌더링
  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isJoining} error={error} />;
  }

  // 방에 성공적으로 입장하면 ConferenceLayout을 렌더링
  return <ConferenceLayout />;
};
