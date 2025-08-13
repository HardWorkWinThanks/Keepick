// src/widgets/video-conference/VideoGrid.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { UserVideoCard } from "@/entities/video-conference/user/ui/UserVideoCard";
import { GestureRecognizer } from "@/features/video-conference/gesture-recognition/ui/GestureRecognizer";

export const VideoGrid = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localUserName = useAppSelector((state) => state.session.userName);
  const users = useAppSelector((state) => state.session.users);
  const remotePeerIds = useAppSelector((state) => state.webrtc.remotePeerIds);

  // 🛑 트리거 변경: isCameraOn 대신 isProducing 상태를 사용합니다.
  const isProducing = useAppSelector((state) => state.media.isProducing);

  // 🛑 isProducing 상태가 true로 바뀔 때 스트림을 가져옵니다.
  useEffect(() => {
    // isProducing이 true라는 것은 모든 WebRTC 설정과 미디어 스트림 생성이
    // 완료되었음을 의미하는 가장 확실한 신호입니다.
    if (isProducing) {
      setLocalStream(mediasoupManager.getLocalStream());
    } else {
      // 방을 나가거나 연결이 끊겨 isProducing이 false가 되면 스트림을 정리합니다.
      setLocalStream(null);
    }
  }, [isProducing]); // 🛑 의존성을 isProducing으로 변경

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  const totalStreams = remotePeerIds.length + (localStream ? 1 : 0);

  return (
    <div className={`grid ${getGridClass(totalStreams)} gap-4 p-4 flex-grow`}>
      {/* 내 비디오 화면 */}
      {localStream && (
        <GestureRecognizer>
          <UserVideoCard
            stream={localStream}
            userName={`${localUserName} (나)`}
            isMuted={true}
          />
        </GestureRecognizer>
      )}

      {/* 다른 참여자들의 비디오 화면 */}
      {remotePeerIds.map((socketId) => {
        const user = users.find((u) => u.id === socketId);
        return (
          <UserVideoCard
            key={socketId}
            socketId={socketId}
            userName={user?.name || "참가자"}
          />
        );
      })}
    </div>
  );
};
