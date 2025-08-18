// src/entities/video-conference/user/ui/UserVideoCard.tsx
"use client";

import { useRef, useEffect } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { useLocalMediaTrack, useRemoteMediaTrack } from "@/shared/hooks/useMediaTrack";
import {
  MicrophoneIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

interface UserVideoCardProps {
  socketId?: string; // 원격 유저의 경우 socketId 제공
  userName: string;
  isLocal?: boolean; // 로컬 유저 여부
}


export const UserVideoCard = ({ socketId, userName, isLocal = false }: UserVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Hook을 통해 트랙 가져오기
  const localVideo = useLocalMediaTrack('video');
  const localAudio = useLocalMediaTrack('audio');
  const remoteVideo = useRemoteMediaTrack(socketId || '', 'video');
  const remoteAudio = useRemoteMediaTrack(socketId || '', 'audio');

  // 로컬/원격에 따라 적절한 트랙 선택
  const videoTrack = isLocal ? localVideo.track : remoteVideo.track;
  const audioTrack = isLocal ? localAudio.track : remoteAudio.track;
  const hasVideo = isLocal ? localVideo.enabled : remoteVideo.enabled;
  const hasAudio = isLocal ? localAudio.enabled : remoteAudio.enabled;
  const isMuted = isLocal ? localAudio.muted : false; // 원격은 항상 muted


  const activeReactions = useAppSelector(
    (state) => state.emojiReaction.activeReactions
  );
  const currentCardUserId = isLocal ? "local" : socketId || "unknown";
  const activeReaction = activeReactions[currentCardUserId];

  // Redux 상태 디버깅
  useEffect(() => {
    console.log(`🎭 [UserVideoCard] ${userName} - currentCardUserId:`, currentCardUserId);
    console.log(`🎭 [UserVideoCard] ${userName} - activeReactions:`, activeReactions);
    console.log(`🎭 [UserVideoCard] ${userName} - activeReaction:`, activeReaction);
  }, [activeReactions, activeReaction, currentCardUserId, userName]);

  // 비디오 트랙을 video 엘리먼트에 연결
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // 🔍 트랙 타입 디버깅 로그 추가
    if (videoTrack) {
      console.log(`🎥 [UserVideoCard] ${userName} - 비디오 트랙 정보:`, {
        trackId: videoTrack.id,
        isLocal,
        socketId: socketId || 'N/A',
        readyState: videoTrack.readyState,
        enabled: videoTrack.enabled,
        kind: videoTrack.kind,
        label: videoTrack.label || 'No label'
      });
    }

    if (videoTrack) {
      // 1. 기존에 srcObject가 없거나, 트랙 ID가 다르면 새로 할당합니다.
      const currentTrack = (videoElement.srcObject as MediaStream)?.getVideoTracks()[0];
      const needsNewConnection = !videoElement.srcObject || !currentTrack || currentTrack.id !== videoTrack.id;
      
      if (needsNewConnection) {
        const newStream = new MediaStream([videoTrack]);
        videoElement.srcObject = newStream;
        videoElement.muted = true; // 로컬 비디오는 항상 음소거
        
        console.log(`🎥 [UserVideoCard] ${userName} - 비디오 트랙을 새로 연결합니다. (${videoTrack.id}) [isLocal: ${isLocal}]`);
        
        // play()는 스트림이 설정된 후 호출되어야 합니다.
        videoElement.play().catch(error => {
          if (error.name !== 'AbortError') {
            console.error(`❌ [UserVideoCard] ${userName} - 자동 재생 실패:`, error);
          }
        });
      } else {
        // 같은 트랙이면 재연결하지 않음
        console.log(`🎥 [UserVideoCard] ${userName} - 동일한 비디오 트랙 사용 중 (${videoTrack.id})`);
      }
    } else {
      // 2. 트랙이 없으면 srcObject를 비웁니다.
      videoElement.srcObject = null;
      console.log(`🎥 [UserVideoCard] ${userName} - 비디오 트랙이 없습니다.`);
    }

    // 클린업 함수는 불필요하므로 제거해도 됩니다.
    // React가 컴포넌트 언마운트 시 video 엘리먼트를 정리합니다.

  }, [videoTrack, userName, isLocal, socketId]); // 의존성 배열에 디버깅에 필요한 값들 추가

  // 오디오 트랙을 audio 엘리먼트에 연결 (원격 피어만)
  useEffect(() => {
    if (isLocal) return; // 로컬 오디오는 재생하지 않음 (에코 방지)

    const audio = audioRef.current;
    if (!audio) return;

    if (audioTrack) {
      // 기존 오디오 트랙과 ID 비교하여 같으면 재연결하지 않음
      const currentAudioTrack = (audio.srcObject as MediaStream)?.getAudioTracks()[0];
      const needsNewAudioConnection = !audio.srcObject || !currentAudioTrack || currentAudioTrack.id !== audioTrack.id;
      
      if (needsNewAudioConnection) {
        // 원격 오디오 트랙을 별도 스트림으로 연결
        const audioStream = new MediaStream([audioTrack]);
        audio.srcObject = audioStream;
        audio.muted = false; // 원격 오디오는 소리 출력
        audio.autoplay = true;
        
        console.log(`🔊 [UserVideoCard] ${userName} - 오디오 트랙 연결됨 (${audioTrack.id})`);
        
        audio.play().catch(error => {
          if (error.name !== 'AbortError') {
            console.error(`❌ [UserVideoCard] ${userName} - 오디오 재생 실패:`, error);
          }
        });
      } else {
        console.log(`🔊 [UserVideoCard] ${userName} - 동일한 오디오 트랙 사용 중 (${audioTrack.id})`);
      }
    } else {
      audio.srcObject = null;
      console.log(`🔊 [UserVideoCard] ${userName} - 오디오 트랙 없음`);
    }

    return () => {
      if (audio.srcObject) {
        audio.srcObject = null;
      }
    };
  }, [audioTrack, userName, isLocal]);


  const isSpeaking = hasAudio && !isMuted;


  return (
    <div className="relative w-full h-full bg-[#222222] rounded-xl overflow-hidden group border border-[#424245]">
      {/* 비디오 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted 
        className={`w-full h-full object-cover`}
      />

      {/* 숨겨진 오디오 엘리먼트 (원격 피어만) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      )}


      {/* 비디오 없을 때 아바타 */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FE7A25]/20 to-[#FCBC34]/20">
          <div className="w-20 h-20 bg-[#FE7A25] rounded-full flex items-center justify-center text-[#222222] text-2xl font-bold font-header">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}




      {/* 반응 오버레이 */}
      {/* <AnimatePresence>
        {activeReaction && (
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
      </AnimatePresence> */}


      {/* 사용자 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 z-10">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium truncate">{userName}</span>
          <div className="flex items-center space-x-2">
            {/* 개선된 마이크 상태 표시 컴포넌트 */}
            <motion.div
              className={`relative p-1 rounded-full transition-all duration-300 ${
                !hasAudio 
                  ? 'bg-gray-800/60 border border-gray-600' 
                  : isSpeaking 
                    ? 'bg-green-500/30 border border-green-400' 
                    : 'bg-green-500/20 border border-green-500'
              }`}
              animate={{
                scale: isSpeaking ? [1, 1.1, 1] : 1,
                backgroundColor: !hasAudio 
                  ? 'rgba(31, 41, 55, 0.6)' 
                  : isSpeaking 
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(34, 197, 94, 0.2)'
              }}
              transition={{
                scale: {
                  repeat: isSpeaking ? Infinity : 0,
                  duration: 1.2,
                  ease: "easeInOut"
                },
                backgroundColor: { duration: 0.3 }
              }}
            >
              <motion.div
                animate={{
                  color: !hasAudio 
                    ? '#6B7280' 
                    : isSpeaking 
                      ? '#22C55E'
                      : '#10B981'
                }}
                transition={{ duration: 0.3 }}
              >
                <MicrophoneIcon 
                  className={`w-4 h-4 transition-opacity duration-300 ${
                    !hasAudio ? 'opacity-50' : 'opacity-100'
                  }`} 
                />
              </motion.div>
              
              {/* 말하는 중일 때 추가 효과 */}
              {isSpeaking && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 0, 0.6]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>

            {!hasVideo && (
              <motion.div 
                className="p-1 bg-gray-800/60 rounded-full border border-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <VideoCameraIcon className="w-4 h-4 text-gray-400 opacity-50" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
