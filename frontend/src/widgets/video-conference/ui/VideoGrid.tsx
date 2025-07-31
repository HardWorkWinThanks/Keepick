// src/widgets/video-conference/ui/VideoGrid.tsx
import React, { useEffect, useRef } from "react";
import type { User } from "@/shared/types/webrtc";

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
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  users,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (
      localVideoRef.current &&
      localVideoRef.current.srcObject !== localStream
    ) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const totalUsers = (users?.length || 0) + 1;
  const getGridTemplateColumns = () => {
    if (totalUsers <= 2) return "repeat(2, 1fr)";
    if (totalUsers <= 4) return "repeat(2, 1fr)";
    if (totalUsers <= 9) return "repeat(3, 1fr)";
    return "repeat(4, 1fr)";
  };

  // 디버깅 로그 추가
  console.log("--- VideoGrid Render ---");
  console.log(
    "Users:",
    users.map((u) => u.id)
  );
  console.log("Remote Streams Keys:", Array.from(remoteStreams.keys()));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: getGridTemplateColumns(),
        gap: "16px",
        padding: "16px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
        placeItems: "center",
      }}
    >
      {/* 로컬 비디오 */}
      <div
        style={{
          position: "relative",
          width: "320px",
          height: "240px",
          backgroundColor: "#000",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            padding: "4px 8px",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          📹 나 (You)
        </div>
      </div>

      {/* 원격 사용자 비디오 */}
      {users.map((user) => {
        const stream = remoteStreams.get(user.id);
        const hasVideo = stream && stream.getVideoTracks().length > 0;

        return (
          <div
            key={user.id}
            style={{
              position: "relative",
              width: "320px",
              height: "240px",
              backgroundColor: "#333",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {stream && hasVideo ? (
              <RemoteVideo stream={stream} userId={user.id} />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                    👤
                  </div>
                  <div>{hasVideo ? "영상 로딩중..." : "비디오 없음"}</div>
                </div>
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "8px",
                padding: "4px 8px",
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              📺 {user.id.substring(0, 8)}...
            </div>
          </div>
        );
      })}
    </div>
  );
};
