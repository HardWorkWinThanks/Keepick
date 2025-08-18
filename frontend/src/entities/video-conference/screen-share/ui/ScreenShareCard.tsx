// src/entities/video-conference/screen-share/ui/ScreenShareCard.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useLocalScreenShareTrack, useRemoteScreenShareTrack } from "@/shared/hooks/useMediaTrack";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  ComputerDesktopIcon 
} from "@heroicons/react/24/solid";

interface ScreenShareCardProps {
  userName: string;
  isLocal?: boolean;
  socketId?: string; // 원격 화면 공유용
  onFullscreenToggle?: (isFullscreen: boolean) => void; // 호환성을 위해 유지
}

export const ScreenShareCard = ({ 
  userName, 
  isLocal = true, 
  socketId,
  onFullscreenToggle 
}: ScreenShareCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 로컬/원격 화면 공유 트랙 가져오기
  const localScreenShare = useLocalScreenShareTrack();
  const remoteScreenShare = useRemoteScreenShareTrack(socketId || '');
  
  // 로컬/원격에 따라 적절한 트랙 선택
  const screenTrack = isLocal ? localScreenShare.track : remoteScreenShare.track;
  const trackId = isLocal ? null : remoteScreenShare.trackId; // 내부 trackId 사용 (원격만)
  const isSharing = isLocal ? localScreenShare.isSharing : remoteScreenShare.hasScreenTrack;
  const hasScreenTrack = isLocal ? localScreenShare.hasScreenTrack : remoteScreenShare.hasScreenTrack;
  
  // 디버깅을 위한 로그 (필요시 활성화)
  // console.log(`🖥️ [ScreenShareCard] Debug:`, {
  //   userName,
  //   isLocal,
  //   socketId,
  //   screenTrack: !!screenTrack,
  //   isSharing,
  //   hasScreenTrack,
  //   trackId: screenTrack?.id
  // });

  // 화면 공유 트랙을 video 엘리먼트에 연결
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (screenTrack && isSharing) {
      const stream = new MediaStream([screenTrack]);
      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      
      console.log(`🖥️ [ScreenShareCard] ${userName} - 화면 공유 트랙 연결됨`, {
        internalTrackId: trackId, // MediaTrackManager 내부 ID
        actualTrackId: screenTrack.id, // 실제 MediaStreamTrack ID
        readyState: screenTrack.readyState,
        enabled: screenTrack.enabled,
        streamId: stream.id
      });
      
      // 트랙 상태 확인
      if (screenTrack.readyState === 'ended') {
        console.warn(`⚠️ [ScreenShareCard] Screen track is ended`);
        return;
      }
      
      // 비디오 로드 및 재생
      const playVideo = async () => {
        try {
          video.load(); // 비디오 다시 로드
          await video.play();
          console.log(`✅ [ScreenShareCard] ${userName} - 비디오 재생 시작됨`);
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error(`❌ [ScreenShareCard] ${userName} - 자동 재생 실패:`, error);
          }
        }
      };
      
      playVideo();
    } else {
      video.srcObject = null;
      console.log(`🖥️ [ScreenShareCard] ${userName} - 화면 공유 트랙 없음`);
    }

    return () => {
      if (video.srcObject) {
        // 트랙은 정지하지 않음 (다른 곳에서 사용 중일 수 있음)
        video.srcObject = null;
      }
    };
  }, [screenTrack, isSharing, userName]);


  // 트랙 상태 변화 감지
  useEffect(() => {
    if (!screenTrack) return;

    const handleTrackEnded = () => {
      console.log(`🔚 Screen share track ended for ${userName}`);
      // 트랙이 끝나면 컴포넌트가 자동으로 언마운트됨 (조건부 렌더링)
    };

    screenTrack.addEventListener('ended', handleTrackEnded);

    return () => {
      screenTrack.removeEventListener('ended', handleTrackEnded);
    };
  }, [screenTrack, userName]);

  // 화면 공유가 없거나 트랙이 끝났으면 렌더링하지 않음
  if (!screenTrack || !isSharing || screenTrack.readyState === 'ended') {
    return null;
  }

  return (
    <motion.div 
      className="relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#424245] w-full h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* 화면 공유 비디오 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain bg-black"
      />

      {/* 화면 공유 없을 때 플레이스홀더 */}
      {(!screenTrack || !isSharing) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#424245]/20 to-[#222222]/20">
          <ComputerDesktopIcon className="w-16 h-16 text-[#424245] mb-4" />
          <span className="text-[#424245] text-lg font-medium">화면 공유 대기 중...</span>
        </div>
      )}


      {/* 화면 공유 정보 */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3">
        <div className="flex items-center space-x-2">
          <ComputerDesktopIcon className="w-5 h-5 text-[#4ade80]" />
          <span className="text-white font-medium">{userName}의 화면 공유</span>
          {isLocal && (
            <span className="bg-[#4ade80] text-black text-xs px-2 py-1 rounded font-medium">
              내 화면
            </span>
          )}
        </div>
      </div>


    </motion.div>
  );
};