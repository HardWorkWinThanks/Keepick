// src/widgets/video-conference/ui/VideoGrid.tsx
import React, { useEffect, useRef } from "react";
import { User } from "@/shared/types/webrtc";

const RemoteVideo: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

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
  localStream: MediaStream | null; // ref 대신 stream 객체를 직접 받습니다.
  remoteStreams: Map<string, MediaStream>;
  users: User[];
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  users,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null); // ref는 내부에서만 사용합니다.
  const totalUsers = (users?.length || 0) + 1;

  // --- useEffect로 localStream의 변화를 감지하고 DOM에 바인딩 ---
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log(
        "✅ (VideoGrid) Local stream has been bound to the video element."
      );
    }
  }, [localStream]);

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
      {/* 로컬 비디오 */}
      <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        {/* localStream이 있을 때만 video 태그를 렌더링합니다. */}
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <p>로컬 비디오 로딩 중...</p>
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded">
          📹 나 (You)
        </div>
      </div>

      {/* 원격 사용자 비디오 (기존과 동일) */}
      {users?.map((user) => {
        const stream = remoteStreams.get(user.id);
        const hasVideo = stream && stream.getVideoTracks().length > 0;
        return (
          <div
            key={user.id}
            className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            {hasVideo ? (
              <RemoteVideo stream={stream!} />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">
                <p>연결 중...</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded">
              📺 {user.id.substring(0, 8)}...
            </div>
          </div>
        );
      })}
    </div>
  );
};
