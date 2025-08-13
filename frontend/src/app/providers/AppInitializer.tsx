"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/shared/hooks/redux"; // 타입이 적용된 useDispatch 훅 (아래 생성법 포함)
import { socketApi } from "@/shared/api/socketApi";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import {
  consumeNewProducerThunk,
  handleProducerClosedThunk,
} from "@/entities/video-conference/consume-stream/model/thunks";

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 앱이 시작될 때 단 한 번만 API 모듈을 초기화합니다.
    console.log("🚀 Initializing API modules...");

    mediasoupManager.init(dispatch);
    socketApi.init(
      dispatch,
      (data) => dispatch(consumeNewProducerThunk(data)),
      (data) => dispatch(handleProducerClosedThunk(data))
    );

    // 컴포넌트 언마운트 시 정리 로직이 필요하다면 여기에 추가할 수 있습니다.
    // (예: socket 연결 해제)
    // return () => { ... }
  }, [dispatch]); // dispatch는 변경되지 않으므로 사실상 한 번만 실행됩니다.

  return <>{children}</>;
};
