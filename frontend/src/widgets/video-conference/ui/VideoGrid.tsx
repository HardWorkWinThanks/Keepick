// src/widgets/video-conference/ui/VideoGrid.tsx
import React, { useEffect, useRef } from "react";
import type { User } from "@/shared/types/webrtc";
import { GestureRecognizer } from "./GestureRecognizer";

/**
 * 원격 비디오를 렌더링하는 가장 안정적인 최종 컴포넌트
 */
const RemoteVideo: React.FC<{ stream: MediaStream; userId: string }> = ({
  stream,
  userId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }

    const handleCanPlay = async () => {
      try {
        videoElement.muted = true;
        await videoElement.play();
        videoElement.muted = false;
        console.log(
          `✅✅✅ Successfully played video for ${userId} WITH SOUND.`
        );
      } catch (error) {
        console.error(`❌❌❌ FAILED to play video for ${userId}`, error);
      }
    };

    videoElement.addEventListener("canplay", handleCanPlay, { once: true });
    return () => {
      videoElement.removeEventListener("canplay", handleCanPlay);
    };
  }, [stream, userId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted // 초기값은 muted로 설정
      style={{ width: "100%", height: "100%", objectFit: "cover" }} // 부모에 꽉 차게 설정
    />
  );
};

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  users: User[];
  isStaticGestureOn: boolean;
  isDynamicGestureOn: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  users,
  isStaticGestureOn,
  isDynamicGestureOn,
}) => {
  const totalUsers = (users?.length || 0) + (localStream ? 1 : 0);

  // ▼▼▼▼▼ 수정된 부분 1번: 혼자 있을 때와 아닐 때를 구분하는 레이아웃 로직 ▼▼▼▼▼
  if (totalUsers <= 1) {
    // 혼자 있을 때: 화면 중앙에 적당한 크기로 표시
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          <GestureRecognizer
            mediaStream={localStream}
            isStaticOn={isStaticGestureOn}
            isDynamicOn={isDynamicGestureOn}
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded-md text-sm">
            📹 나 (You)
          </div>
        </div>
      </div>
    );
  }
  // ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲

  // 여러 명 있을 때: 기존 그리드 레이아웃 사용
  const getGridClass = () => {
    if (totalUsers <= 1) return "grid-cols-1";
    if (totalUsers === 2) return "grid-cols-1 md:grid-cols-2"; // 2명일 땐 모바일에서 세로로, 데스크탑에서 가로로
    if (totalUsers <= 4) return "grid-cols-2";
    if (totalUsers <= 6) return "grid-cols-2 lg:grid-cols-3";
    if (totalUsers <= 9) return "grid-cols-3";
    return "grid-cols-3 lg:grid-cols-4"; // 9명 초과 시
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 w-full h-full items-center`}>
      {/* 로컬 비디오 */}
      {localStream && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
          <GestureRecognizer
            mediaStream={localStream}
            isStaticOn={isStaticGestureOn}
            isDynamicOn={isDynamicGestureOn}
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded-md text-sm font-semibold">
            📹 나 (You)
          </div>
        </div>
      )}

      {/* 원격 사용자 비디오 */}
      {users.map((user) => {
        const stream = remoteStreams.get(user.id);
        const hasVideo = stream && stream.getVideoTracks().length > 0;
        return (
          <div
            key={user.id}
            className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg"
          >
            {stream && hasVideo ? (
              <RemoteVideo stream={stream} userId={user.id} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div>{hasVideo ? "영상 로딩중..." : "비디오 없음"}</div>
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded-md text-sm font-semibold">
              📺 {user.id.substring(0, 8)}...
            </div>
          </div>
        );
      })}
    </div>
  );
  // ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲
};
