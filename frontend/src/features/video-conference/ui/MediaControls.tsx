// src/features/video-conference/ui/MediaControls.tsx
"use client";

import { useState } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { useLocalMediaControls, useTransportState } from "@/shared/hooks/useMediaTrack";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { gestureHandler, chatHandler, webrtcHandler } from "@/shared/api/socket";
import {
  MicrophoneIcon,
  VideoCameraIcon,
  CogIcon,
  PhoneXMarkIcon,
} from "@heroicons/react/24/solid";

export const MediaControls = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  const { audio, video, toggleAudio, toggleVideo, hasLocalMedia } = useLocalMediaControls();
  const { connected: isConnected } = useTransportState();

  return (
    <>
      {/* 오디오 토글 */}
      <button
        onClick={toggleAudio}
        disabled={!isConnected || !hasLocalMedia}
        className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 ${
          audio.enabled
            ? 'bg-[#FE7A25] text-white hover:bg-[#FF8C42]'
            : 'bg-[#D22016] text-white hover:bg-[#B91C1C]'
        }`}
        title={audio.enabled ? '마이크 끄기' : '마이크 켜기'}
      >
        {audio.enabled ? (
          <MicrophoneIcon className="w-6 h-6" />
        ) : (
          <MicrophoneIcon className="w-6 h-6 opacity-50" />
        )}
      </button>

      {/* 비디오 토글 */}
      <button
        onClick={toggleVideo}
        disabled={!isConnected || !hasLocalMedia}
        className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 ${
          video.enabled
            ? 'bg-[#FE7A25] text-white hover:bg-[#FF8C42]'
            : 'bg-[#D22016] text-white hover:bg-[#B91C1C]'
        }`}
        title={video.enabled ? '카메라 끄기' : '카메라 켜기'}
      >
        {video.enabled ? (
          <VideoCameraIcon className="w-6 h-6" />
        ) : (
          <VideoCameraIcon className="w-6 h-6 opacity-50" />
        )}
      </button>

      {/* 방 나가기 */}
      <button
        onClick={() => {
          mediasoupManager.cleanup();
          webrtcHandler.leaveRoom();
          window.location.href = '/';
        }}
        className="p-3 rounded-full bg-[#D22016] text-white hover:bg-[#B91C1C] transition-all duration-200 transform hover:scale-110"
        title="방 나가기"
      >
        <PhoneXMarkIcon className="w-6 h-6" />
      </button>

      {/* 미디어 상태 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
          {isConnected ? '🟢' : '🔴'} {hasLocalMedia ? `A:${audio.enabled ? '✓' : '✗'} V:${video.enabled ? '✓' : '✗'}` : 'No Media'}
        </div>
      )}
    </>
  );
};