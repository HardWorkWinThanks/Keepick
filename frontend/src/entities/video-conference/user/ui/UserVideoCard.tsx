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

// useRemoteStream 훅을 import 합니다.
import { useRemoteStream } from "@/shared/hooks/useRemoteStream";


interface UserVideoCardProps {
  stream?: MediaStream; // 로컬 스트림용 (local-user일 때 사용)
  socketId?: string; // 원격 유저용 (원격 유저의 ID)
  userName: string;
  isMuted?: boolean; // 로컬 유저의 음소거 상태를 나타냄
}


export const UserVideoCard = ({
  stream,
  socketId,
  userName,
  isMuted = false,
}: UserVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // ⭐ 변경: useRemoteStream 훅을 사용하여 원격 스트림을 가져옵니다.
  // socketId가 없는 경우 (로컬 사용자)에는 props로 받은 stream을 사용합니다.
  const remoteUserStream = useRemoteStream(socketId);
  const streamToPlay = socketId ? remoteUserStream : stream;
  
  // streamToPlay의 유무와 트랙 상태에 따라 hasVideo/hasAudio를 동적으로 설정합니다.
  const hasVideo = !!streamToPlay?.getVideoTracks().some(t => t.enabled);
  const hasAudio = !!streamToPlay?.getAudioTracks().some(t => t.enabled);


  const activeReactions = useAppSelector(
    (state) => state.emojiReaction.activeReactions
  );
  const currentCardUserId = socketId || "local-user";
  const activeReaction = activeReactions[currentCardUserId];


  // ⭐ 변경: 스트림 상태 관리를 위한 복잡한 useEffect 블록이 제거되었습니다.
  // 이 역할은 이제 useRemoteStream 훅이 담당합니다.


  // [기존과 동일] state로 관리되는 스트림을 video 엘리먼트에 연결하는 useEffect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamToPlay) {
      if (video) video.srcObject = null; // 스트림이 없으면 srcObject 해제
      return;
    }

    console.log(`🎥 [UserVideoCard] ${userName} - 새로운 스트림으로 srcObject 설정 중. 트랙 수: ${streamToPlay.getTracks().length}`);
    video.srcObject = streamToPlay;
    video.muted = true; // 브라우저 자동 재생 정책을 위해 필수
    // video.autoplay = true;
    video.load(); // ⭐ 참고: 이전 대화에서 제안된 video.load()는 필요시 여기에 추가해주세요.


    const handleCanPlay = () => {
      console.log(`✅ [UserVideoCard] ${userName} - canplay 이벤트 발생. 비디오 재생 시도.`);
      video.play().catch(error => {
        if (error.name !== 'AbortError') { // 사용자가 직접 일시정지한 경우 외의 에러
          console.error(`❌ [UserVideoCard] ${userName} - 자동 재생 실패:`, error);
        }
      });
    };

    const handleLoadedMetadata = () => {
      console.log(`📺 [UserVideoCard] ${userName} - 메타데이터 로드 완료:`, {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
      });
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);


    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [streamToPlay, userName]);


  const isLocalCard = isMuted; // isMuted prop은 로컬 카드일 때만 true로 가정 (UI 목적)
  // hasAudio는 실제 오디오 트랙 유무를 나타내며, isMuted는 로컬 사용자의 음소거 버튼 상태를 나타냄
  const isSpeaking = hasAudio && !isMuted;


  return (
    <div className="relative w-full h-full bg-[#222222] rounded-xl overflow-hidden group border border-[#424245]">
      {/* 비디오 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        // 원격 비디오는 브라우저 자동 재생 정책 때문에 항상 muted로 시작하는 것이 좋습니다.
        // isMuted는 로컬 유저 카드에서만 의미있는 값으로 사용됩니다.
        muted={isMuted || !!socketId} 
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
