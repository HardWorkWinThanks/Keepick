// src/widgets/video-conference/BottomControls.tsx
"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleChat } from "@/entities/chat/model/slice";
import { ToggleCameraButton } from "@/features/video-conference/toggle-camera/ui/ToggleCameraButton";
import { ToggleMicButton } from "@/features/video-conference/toggle-mic/ui/ToggleMicButton";
import { LeaveRoomButton } from "@/features/video-conference/leave-room/ui/LeaveRoomButton";
import { ScreenShareButton } from "@/features/screen-share/ui/ScreenShareButton";
import { SettingsPanel } from "./SettingsPanel";
import { ChatBubbleLeftIcon, CogIcon } from "@heroicons/react/24/solid";

export const BottomControls = () => {
  const dispatch = useAppDispatch();
  const { isChatOpen, unreadCount } = useAppSelector((state) => state.chat);
  const { roomId } = useAppSelector((state) => state.session);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleChatToggle = () => {
    dispatch(toggleChat());
  };

  const handleSettingsToggle = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <>
      <div className="fixed bottom-0 left-1/2 p-4 rounded-full flex justify-center items-center gap-4 mb-4 backdrop-blur-sm bg-[#2C2C2E]/80 transform -translate-x-1/2">
        {/* 마이크 */}
        <ToggleMicButton />

        {/* 카메라 */}
        <ToggleCameraButton />

        {/* 화면 공유 */}
        <ScreenShareButton roomId={roomId || ""} />

        {/* 채팅 */}
        <button
          onClick={handleChatToggle}
          className={`relative p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
            isChatOpen
              ? "bg-[#FE7A25] text-[#222222]"
              : "bg-[#424245] text-[#FFFFFF] hover:bg-[#4a4a4d]"
          }`}
          aria-label={isChatOpen ? "채팅 닫기" : "채팅 열기"}
        >
          <ChatBubbleLeftIcon className="w-6 h-6" />

          {/* 읽지 않은 메시지 카운트 */}
          {unreadCount > 0 && !isChatOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D22016] text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </button>

        {/* 설정 */}
        <button
          onClick={handleSettingsToggle}
          className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
            isSettingsOpen
              ? "bg-[#FE7A25] text-[#222222]"
              : "bg-[#424245] text-[#FFFFFF] hover:bg-[#4a4a4d]"
          }`}
          aria-label="설정"
        >
          <CogIcon className="w-6 h-6" />
        </button>

        {/* 나가기 */}
        <LeaveRoomButton />
      </div>

      {/* 설정 패널 */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
