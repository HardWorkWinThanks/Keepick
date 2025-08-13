// src/widgets/screen-share/ScreenShareViewer.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { screenShareManager } from "@/shared/api/screenShareManager";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/solid";

interface ScreenShareViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ScreenShareViewer = ({
  isVisible,
  onClose,
}: ScreenShareViewerProps) => {
  const { localScreenShare, remoteScreenShares } = useAppSelector(
    (state) => state.screenShare
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 모든 화면 공유 (로컬 + 원격)
  const allScreenShares = [
    ...(localScreenShare ? [localScreenShare] : []),
    ...Object.values(remoteScreenShares),
  ];

  // 선택된 화면 공유가 없으면 첫 번째로 설정
  useEffect(() => {
    if (allScreenShares.length > 0 && !selectedShareId) {
      setSelectedShareId(allScreenShares[0].id);
    }
  }, [allScreenShares, selectedShareId]);

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!isVisible || allScreenShares.length === 0) {
    return null;
  }

  const selectedShare =
    allScreenShares.find((share) => share.id === selectedShareId) ||
    allScreenShares[0];
  const isLocalShare = selectedShare.id === localScreenShare?.id;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 bg-[#222222] z-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 bg-[#2C2C2E] border-b border-[#424245]">
          <div className="flex items-center space-x-3">
            <ComputerDesktopIcon className="w-6 h-6 text-[#FE7A25]" />
            <div>
              <h3 className="text-[#FFFFFF] font-semibold font-header">
                화면 공유{" "}
                {isLocalShare ? "(내 화면)" : `- ${selectedShare.peerName}`}
              </h3>
              <p className="text-[#A0A0A5] text-sm">
                {allScreenShares.length}개의 화면이 공유 중
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 전체화면 버튼 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-[#424245] transition-colors"
              aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5 text-[#A0A0A5]" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5 text-[#A0A0A5]" />
              )}
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#424245] transition-colors"
              aria-label="화면 공유 뷰어 닫기"
            >
              <XMarkIcon className="w-5 h-5 text-[#A0A0A5]" />
            </button>
          </div>
        </div>

        {/* 메인 뷰어 영역 */}
        <div className="flex-1 flex">
          {/* 메인 화면 */}
          <div className="flex-1 flex items-center justify-center p-4">
            <ScreenShareVideo
              screenShare={selectedShare}
              isLocal={isLocalShare}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* 사이드바 (다중 화면 공유가 있을 때) */}
          {allScreenShares.length > 1 && (
            <div className="w-80 bg-[#2C2C2E] border-l border-[#424245] p-4">
              <h4 className="text-[#FFFFFF] font-medium mb-4">
                활성 화면 공유
              </h4>
              <div className="space-y-3">
                {allScreenShares.map((share) => (
                  <button
                    key={share.id}
                    onClick={() => setSelectedShareId(share.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedShareId === share.id
                        ? "bg-[#FE7A25]/20 border border-[#FE7A25]"
                        : "bg-[#424245] hover:bg-[#4a4a4d]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ComputerDesktopIcon className="w-5 h-5 text-[#FE7A25]" />
                      <div>
                        <p className="text-[#FFFFFF] text-sm font-medium">
                          {share.id === localScreenShare?.id
                            ? "내 화면"
                            : share.peerName}
                        </p>
                        <p className="text-[#A0A0A5] text-xs">
                          {new Date(share.startedAt).toLocaleTimeString()}부터
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// 화면 공유 비디오 컴포넌트
interface ScreenShareVideoProps {
  screenShare: any;
  isLocal: boolean;
  className?: string;
}

const ScreenShareVideo = ({
  screenShare,
  isLocal,
  className,
}: ScreenShareVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    let stream: MediaStream | null = null;

    if (isLocal) {
      // 로컬 화면 공유 스트림
      stream = screenShareManager.getLocalScreenStream();
    } else {
      // 원격 화면 공유 스트림
      stream =
        screenShareManager.getRemoteScreenStream(screenShare.peerId) ?? null;
    }

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [screenShare, isLocal]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{
        backgroundColor: "#000",
        border: "2px solid #424245",
      }}
    />
  );
};
