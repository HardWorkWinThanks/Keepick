// src/widgets/video-conference/VideoGrid.tsx
"use client";

import { useAppSelector } from "@/shared/hooks/redux";
import { UserVideoCard } from "@/entities/video-conference/user/ui/UserVideoCard";
import { useAllRemotePeers, useLocalMediaTrack } from "@/shared/hooks/useMediaTrack";

export const VideoGrid = () => {
  const localUserName = useAppSelector((state) => state.session.userName);
  const remotePeers = useAllRemotePeers();
  const localVideo = useLocalMediaTrack('video');
  const localAudio = useLocalMediaTrack('audio');
  
  // 로컬 미디어 트랙이 하나라도 있으면 표시
  const hasLocalMedia = localVideo.track || localAudio.track;

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  const totalStreams = remotePeers.length + (hasLocalMedia ? 1 : 0);

  // 디버깅 로그 제거 (필요시 활성화)
  // console.log(`📹 [VideoGrid] Rendering - Total streams: ${totalStreams}, HasLocalMedia: ${hasLocalMedia}, Remote: ${remotePeers.length}`);

  return (
    <div className={`grid ${getGridClass(totalStreams)} gap-4 p-4 flex-grow`}>
      {/* 로컬 사용자 비디오 */}
      {hasLocalMedia && (
        <div key="local" className="relative">
          <UserVideoCard
            userName={`${localUserName || "나"} (나)`}
            isLocal={true}
          />
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            Local
          </div>
        </div>
      )}

      {/* 원격 사용자들 비디오 */}
      {remotePeers.map((peer) => (
        <div key={peer.socketId} className="relative">
          <UserVideoCard
            socketId={peer.socketId}
            userName={peer.peerName}
            isLocal={false}
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            {peer.peerName}
          </div>
        </div>
      ))}
    </div>
  );
  };