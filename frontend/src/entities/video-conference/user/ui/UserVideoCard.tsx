"use client";

import { useEffect, useRef } from "react";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

interface UserVideoCardProps {
  // stream과 socketId 모두 선택적(optional) props로 변경
  stream?: MediaStream | null; // 로컬 스트림은 직접 전달받음
  socketId?: string; // 원격 스트림은 socketId로 조회
  userName: string;
  isMuted?: boolean;
}

export const UserVideoCard = ({
  stream,
  socketId,
  userName,
  isMuted = false,
}: UserVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // stream 또는 socketId prop이 변경될 때마다 비디오 소스를 업데이트합니다.
  useEffect(() => {
    if (!videoRef.current) return;

    let videoStream: MediaStream | null | undefined = stream;

    // 🛑 socketId가 제공되면, mediasoupManager에서 해당 원격 스트림을 가져옵니다.
    if (socketId) {
      videoStream = mediasoupManager.getRemoteStream(socketId);
    }

    // 최종적으로 할당할 스트림이 있는지 확인합니다.
    if (videoStream) {
      videoRef.current.srcObject = videoStream;
    } else {
      // 스트림이 없는 경우(연결 종료 등) 비디오 소스를 초기화합니다.
      videoRef.current.srcObject = null;
    }
  }, [stream, socketId]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      <video
        // '나'의 비디오인 경우(isMuted=true)에만 id와 스타일을 적용합니다.
        id={isMuted ? "local-video" : undefined}
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
        style={{ transform: isMuted ? "scaleX(-1)" : "none" }}
      />
      <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-sm">
        {userName}
      </div>
    </div>
  );
};
