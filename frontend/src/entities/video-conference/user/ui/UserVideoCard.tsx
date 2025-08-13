// src/entities/video-conference/user/ui/UserVideoCard.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import {
  MicrophoneIcon,
  SpeakerXMarkIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

interface UserVideoCardProps {
  stream?: MediaStream;
  socketId?: string;
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
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  // 이모지 반응 상태 가져오기
  const emojiReactions = useAppSelector(
    (state) => state.emojiReaction?.activeReactions || {}
  );
  const currentUserId = socketId || "current-user"; // 현재 사용자 ID
  const activeReaction = emojiReactions[currentUserId];

  // 원격 스트림 가져오기
  const remoteStream = socketId
    ? mediasoupManager.getRemoteStream(socketId)
    : stream;
  const finalStream = remoteStream || stream;

  useEffect(() => {
    if (finalStream && videoRef.current) {
      videoRef.current.srcObject = finalStream;

      // 트랙 상태 확인
      const videoTracks = finalStream.getVideoTracks();
      const audioTracks = finalStream.getAudioTracks();

      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
      setHasAudio(audioTracks.length > 0 && audioTracks[0].enabled);

      // 트랙 상태 변경 리스너
      videoTracks.forEach((track) => {
        track.addEventListener("ended", () => setHasVideo(false));
      });
      audioTracks.forEach((track) => {
        track.addEventListener("ended", () => setHasAudio(false));
      });
    }
  }, [finalStream]);

  return (
    <div className="relative w-full h-full bg-[#222222] rounded-xl overflow-hidden border border-[#424245] group">
      {/* 비디오 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideo ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 비디오 없을 때 아바타 */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FE7A25]/20 to-[#FCBC34]/20">
          <div className="w-20 h-20 bg-[#FE7A25] rounded-full flex items-center justify-center text-[#222222] text-2xl font-bold font-header">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* 이모지 반응 오버레이 */}
      <AnimatePresence>
        {activeReaction && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 3,
              times: [0, 0.1, 0.8, 1],
              ease: "easeOut",
            }}
          >
            <div className="text-6xl filter drop-shadow-lg">
              {activeReaction.emoji}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 사용자 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium truncate">{userName}</span>

          <div className="flex items-center space-x-2">
            {/* 마이크 상태 */}
            {hasAudio ? (
              <div className="p-1 bg-[#4ade80]/20 rounded-full">
                <MicrophoneIcon className="w-4 h-4 text-[#4ade80]" />
              </div>
            ) : (
              <div className="p-1 bg-[#D22016]/20 rounded-full">
                <SpeakerXMarkIcon className="w-4 h-4 text-[#D22016]" />
              </div>
            )}

            {/* 비디오 꺼짐 표시 */}
            {!hasVideo && (
              <div className="p-1 bg-[#D22016]/20 rounded-full">
                <VideoCameraSlashIcon className="w-4 h-4 text-[#D22016]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 호버 시 상호작용 힌트 (미래 기능용) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-white text-xs">제스처로 반응하기</span>
        </div>
      </div>
    </div>
  );
};
