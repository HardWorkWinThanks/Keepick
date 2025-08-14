  // src/widgets/video-conference/VideoGrid.tsx
  "use client";

  import { useEffect, useState } from "react";
  import { useAppSelector } from "@/shared/hooks/redux";
  import { mediasoupManager } from "@/shared/api/mediasoupManager";
  import { UserVideoCard } from "@/entities/video-conference/user/ui/UserVideoCard";
  import { GestureRecognizer } from "@/features/video-conference/gesture-recognition/ui/GestureRecognizer";

  export const VideoGrid = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    // const [remoteStreamUpdateTrigger, setRemoteStreamUpdateTrigger] = useState(0);

    const localUserName = useAppSelector((state) => state.session.userName);
    const users = useAppSelector((state) => state.session.users);
    const remotePeerIds = useAppSelector((state) => state.webrtc.remotePeerIds);

    // 🛑 트리거 변경: isCameraOn 대신 isProducing 상태를 사용합니다.
    const isProducing = useAppSelector((state) => state.media.isProducing);

    // 🛑 isProducing 상태가 true로 바뀔 때 스트림을 가져옵니다.
    useEffect(() => {
      console.log(`📹 [VideoGrid] isProducing changed: ${isProducing}`);
      // isProducing이 true라는 것은 모든 WebRTC 설정과 미디어 스트림 생성이
      // 완료되었음을 의미하는 가장 확실한 신호입니다.
      if (isProducing) {
        const stream = mediasoupManager.getLocalStream();
        console.log(`📹 [VideoGrid] Got local stream:`, stream);
        setLocalStream(stream);
      } else {
        // 방을 나가거나 연결이 끊겨 isProducing이 false가 되면 스트림을 정리합니다.
        console.log(`📹 [VideoGrid] Clearing local stream`);
        setLocalStream(null);
      }
    }, [isProducing]); // 🛑 의존성을 isProducing으로 변경

    // // mediasoupManager의 stream-updated 이벤트 구독
    // useEffect(() => {
    //   const handleStreamUpdate = ({ socketId }: { socketId: string }) => {
    //     console.log(`📡 [VideoGrid] Stream updated for ${socketId}, triggering re-render`);
    //     setRemoteStreamUpdateTrigger(prev => prev + 1);
    //   };

    //   mediasoupManager.on('stream-updated', handleStreamUpdate);

    //   return () => {
    //     mediasoupManager.off('stream-updated', handleStreamUpdate);
    //   };
    // }, []);

    // // 원격 참여자 디버깅 및 스트림 강제 업데이트
    // useEffect(() => {
    //   console.log(`📹 [VideoGrid] Remote peers changed:`, remotePeerIds);
    //   console.log(`📹 [VideoGrid] Users:`, users);
      
    //   // 각 원격 참여자의 스트림 상태 확인
    //   remotePeerIds.forEach(socketId => {
    //     const stream = mediasoupManager.getRemoteStream(socketId);
    //     console.log(`📹 [VideoGrid] Remote stream for ${socketId}:`, stream);
    //     if (stream) {
    //       console.log(`📹 [VideoGrid] Stream tracks for ${socketId}:`, {
    //         videoTracks: stream.getVideoTracks().length,
    //         audioTracks: stream.getAudioTracks().length,
    //         streamId: stream.id,
    //         active: stream.active,
    //         tracks: stream.getTracks().map(track => ({
    //           kind: track.kind,
    //           enabled: track.enabled,
    //           readyState: track.readyState,
    //           id: track.id
    //         }))
    //       });
    //     }
    //   });
      
    // }, [remotePeerIds, users, remoteStreamUpdateTrigger]);

    const getGridClass = (count: number) => {
      if (count <= 1) return "grid-cols-1";
      if (count === 2) return "grid-cols-1 md:grid-cols-2";
      if (count <= 4) return "grid-cols-2";
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    };

    const totalStreams = remotePeerIds.length + (localStream ? 1 : 0);

    console.log(`📹 [VideoGrid] Rendering - Total streams: ${totalStreams}, Local: ${!!localStream}, Remote: ${remotePeerIds.length}`);

    return (
      <div className={`grid ${getGridClass(totalStreams)} gap-4 p-4 flex-grow`}>
        {/* 내 비디오 화면 - GestureRecognizer 임시 비활성화 */}
        {localStream && (
          <div key="local">
            <UserVideoCard
              stream={localStream}
              userName={`${localUserName} (나)`}
              isMuted={true}
            />
          </div>
        )}

        {/* 다른 참여자들의 비디오 화면 */}
        {remotePeerIds.map((socketId) => {
          const user = users.find((u) => u.id === socketId);
          console.log(`📹 [VideoGrid] Rendering remote user ${socketId}:`, user);
          return (
            <div key={socketId}>
              <UserVideoCard
                socketId={socketId}
                userName={user?.name || "참가자"}
              />
            </div>
          );
        })}
      </div>
    );
  };