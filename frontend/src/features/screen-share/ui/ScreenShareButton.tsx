// src/features/screen-share/ui/ScreenShareButton.tsx
"use client";

import { socketManager } from "@/shared/api/socket";
import { useScreenShareControls } from "../hooks/useScreenShare";
import { ComputerDesktopIcon, StopIcon } from "@heroicons/react/24/solid";

interface ScreenShareButtonProps {
  roomId: string;
  className?: string;
}

export const ScreenShareButton = ({
  roomId,
  className = "",
}: ScreenShareButtonProps) => {
  const { isSharing, isLoading, error, toggleScreenShare } = useScreenShareControls(roomId);
  const socketId = socketManager.getSocket()?.id || "unknown";

  const handleToggleScreenShare = async () => {
    try {
      await toggleScreenShare(socketId);
    } catch (error) {
      console.error("Screen share toggle failed:", error);
    }
  };

  return (
    <button
      onClick={handleToggleScreenShare}
      disabled={isLoading}
      className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
        isSharing
          ? "bg-[#D22016] text-white"
          : "bg-[#424245] text-[#FFFFFF] hover:bg-[#4a4a4d]"
      } ${className}`}
      aria-label={isSharing ? "화면 공유 중지" : "화면 공유 시작"}
      title={
        isLoading
          ? "처리 중..."
          : isSharing
          ? "화면 공유 중지"
          : "화면 공유 시작"
      }
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isSharing ? (
        <StopIcon className="w-6 h-6" />
      ) : (
        <ComputerDesktopIcon className="w-6 h-6" />
      )}
    </button>
  );
};
