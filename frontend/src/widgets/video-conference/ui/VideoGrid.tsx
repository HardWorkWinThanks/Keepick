// src/widgets/video-conference/ui/VideoGrid.tsx
import React, { useEffect, useRef } from "react";
import { User } from "@/shared/types/webrtc";

const RemoteVideo: React.FC<{ stream: MediaStream; userId: string }> = ({
  stream,
  userId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error(
          `❌ 자동 재생 실패 (user: ${userId}). 사용자의 상호작용이 필요할 수 있습니다.`,
          err
        );
      });
    }
  }, [stream, userId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
};

interface VideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteStreams: Map<string, MediaStream>;
  users: User[];
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localVideoRef,
  remoteStreams,
  users,
}) => {
  const totalUsers = users.length + 1; // +1은 로컬 사용자

  const getGridClass = () => {
    if (totalUsers <= 1) return "grid-cols-1";
    if (totalUsers <= 2) return "grid-cols-2";
    if (totalUsers <= 4) return "grid-cols-2";
    if (totalUsers <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div
      className={`grid ${getGridClass()} gap-4 p-4 w-full h-full overflow-auto`}
    >
      {/* 로컬 비디오 (항상 첫 번째) - localVideoRef.current가 유효할 때만 video 태그 렌더링 */}
      {/* videoRef의 current는 초기 null이므로, 실제 DOM에 마운트된 후에만 접근해야 합니다. */}
      {/* VideoConference에서 이미 localVideoRef.current.srcObject = localStream; 하는 로직이 있으므로, */}
      {/* 여기에 다시 null 체크를 하는 것은 큰 의미가 없습니다. */}
      {/* 다만, 사용자가 없는 경우를 대비한 플레이스홀더를 제공할 수는 있습니다. */}

      <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        {localVideoRef.current ? ( // 이 로직은 불필요하지만, 명시적으로 null 체크를 원한다면
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <p>로컬 비디오 로딩 중...</p> {/* 또는 "카메라 연결 중..." */}
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded">
          📹 나 (You)
        </div>
      </div>

      {/* 원격 사용자들의 비디오 (기존과 동일) */}
      {users.map((user) => {
        const stream = remoteStreams.get(user.id);
        const hasVideo = stream && stream.getVideoTracks().length > 0;

        return (
          <div
            key={user.id}
            className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            {hasVideo ? (
              <RemoteVideo stream={stream!} userId={user.id} />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">
                <p>연결 중...</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded">
              📺 {user.email || user.id.substring(0, 8) + "..."}
            </div>
          </div>
        );
      })}
    </div>
  );
};
