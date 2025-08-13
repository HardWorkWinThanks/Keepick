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
import { JoinForm } from "@/features/video-conference/join-room";
import { socketApi } from "@/shared/api/socketApi"; // 🛑 API 모듈 import
import { mediasoupManager } from "@/shared/api/mediasoupManager"; // 🛑 API 모듈 import

interface ConferenceClientPageProps {
  roomId: string;
}

export const ConferenceClientPage = ({ roomId }: ConferenceClientPageProps) => {
  const dispatch = useAppDispatch();
  const { isInRoom, error } = useAppSelector((state) => state.session);
  const isJoining = useAppSelector(
    (state) => state.session.status === "pending"
  );

  useEffect(() => {
    // thunk 함수들을 socketApi에 주입하여 초기화합니다.
    socketApi.init(
      dispatch,
      (params) => dispatch(consumeNewProducerThunk(params)),
      (params) => dispatch(handleProducerClosedThunk(params))
    );
    // mediasoupManager에도 dispatch를 주입합니다.
    mediasoupManager.init(dispatch);
  }, [dispatch]);

  useEffect(() => {
    return () => {
      // 컴포넌트가 사라질 때, 방에 참여한 상태였다면 자동으로 떠납니다.
      if (isInRoom) {
        dispatch(leaveRoomThunk());
      }
    };
  }, [dispatch, isInRoom]);

  const handleJoin = (userName: string) => {
    console.log(
      `[ConferencePage] handleJoin 함수 실행됨. 사용자 이름: ${userName}`
    );
    if (roomId) {
      console.log(`[1] Thunk 출발! roomId: ${roomId}, userName: ${userName}`);
      dispatch(joinRoomThunk({ roomId, userName }));
    }
  };

  // 🛑 isInRoom 상태에 따라 렌더링을 분기합니다.
  if (!isInRoom) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <JoinForm
          onJoin={handleJoin}
          isLoading={isJoining} // 🛑 수정된 로딩 상태를 전달합니다.
          error={error}
        />
      </div>
    );
  }

  // 방에 성공적으로 입장하면 ConferenceLayout을 렌더링합니다.
  return <ConferenceLayout />;
};
