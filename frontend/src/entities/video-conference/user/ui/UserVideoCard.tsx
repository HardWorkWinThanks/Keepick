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

  const activeReactions = useAppSelector(
    (state) => state.emojiReaction.activeReactions
  );
  const currentCardUserId = socketId || "local-user";
  const activeReaction = activeReactions[currentCardUserId];

  const remoteStream = socketId
    ? mediasoupManager.getRemoteStream(socketId)
    : stream;
  const finalStream = remoteStream || stream;

  useEffect(() => {
    if (finalStream && videoRef.current) {
      videoRef.current.srcObject = finalStream;

      const videoTracks = finalStream.getVideoTracks();
      const audioTracks = finalStream.getAudioTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
      setHasAudio(audioTracks.length > 0 && audioTracks[0].enabled);

      const handleTrackEnded =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () =>
          setter(false);
      videoTracks.forEach((track) =>
        track.addEventListener("ended", handleTrackEnded(setHasVideo))
      );
      audioTracks.forEach((track) =>
        track.addEventListener("ended", handleTrackEnded(setHasAudio))
      );
    }
  }, [finalStream]);

  const isLocalCard = isMuted;
  const isSpeaking = hasAudio && !isMuted;

  return (
    <div className="relative w-full h-full bg-[#222222] rounded-xl overflow-hidden group border border-[#424245]">
      {/* 비디오 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`w-full h-full object-cover`}
      />

      {/* 비디오 없을 때 아바타 */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FE7A25]/20 to-[#FCBC34]/20">
          <div className="w-20 h-20 bg-[#FE7A25] rounded-full flex items-center justify-center text-[#222222] text-2xl font-bold font-header">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* 발언자 표시 UI (히트 스타일) */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-1 bg-[#4ade80] rounded-b-full shadow-[0_0_10px_rgba(74,222,128,0.8)] z-20"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* 반응 오버레이 */}
      <AnimatePresence>
        {/*
          [수정]
          - activeReaction이 있고, 현재 카드가 로컬 사용자(나 자신)의 카드가 아닐 때만(!isLocalCard) 애니메이션을 표시합니다.
          - 이를 통해 반응을 보낸 사람은 자신의 화면에서 중복 UI를 보지 않고, 받는 사람의 화면에만 애니메이션이 표시됩니다.
          - 로컬 사용자에게만 보이던 왼쪽 상단의 정적 이모지 UI는 제거되었습니다.
        */}
        {activeReaction && !isLocalCard && (
          <motion.div
            key="dynamic-reaction"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 3,
              times: [0, 0.1, 0.8, 1],
              ease: "easeOut",
            }}
          >
            <div className="text-7xl filter drop-shadow-lg">
              {activeReaction.emoji}
            </div>
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-lg font-semibold shadow-lg">
              {activeReaction.userName}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 사용자 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 z-10">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium truncate">{userName}</span>
          <div className="flex items-center space-x-2">
            {hasAudio && (
              <div className="p-1 bg-[#4ade80]/20 rounded-full">
                <MicrophoneIcon className="w-4 h-4 text-[#4ade80]" />
              </div>
            )}
            {!hasAudio && (
              <div className="p-1 bg-[#D22016]/20 rounded-full">
                <SpeakerXMarkIcon className="w-4 h-4 text-[#D22016]" />
              </div>
            )}
            {!hasVideo && (
              <div className="p-1 bg-[#D22016]/20 rounded-full">
                <VideoCameraSlashIcon className="w-4 h-4 text-[#D22016]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
