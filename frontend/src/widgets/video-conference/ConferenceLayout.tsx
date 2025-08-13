// src/widgets/video-conference/ConferenceLayout.tsx
"use client";

import { useState } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { VideoGrid } from "./VideoGrid";
import { BottomControls } from "./BottomControls";
import { ChatSidebar } from "@/widgets/chat/ChatSidebar";
import { ScreenShareViewer } from "@/widgets/screen-share/ScreenShareViewer";
import { motion, AnimatePresence } from "framer-motion";

export const ConferenceLayout = () => {
  const isChatOpen = useAppSelector((state) => state.chat.isChatOpen);
  const { activeScreenShareCount } = useAppSelector(
    (state) => state.screenShare
  );
  const [isScreenShareViewerOpen, setIsScreenShareViewerOpen] = useState(false);

  // 화면 공유가 활성화되어 있으면 자동으로 뷰어 열기
  const hasActiveScreenShare = activeScreenShareCount > 0;

  return (
    <div className="flex h-screen bg-[#222222] overflow-hidden">
      {/* 메인 콘텐츠 영역 */}
      <motion.main
        className="flex-1 flex flex-col relative"
        animate={{
          marginRight: isChatOpen ? "400px" : "0px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        {/* 비디오 그리드 */}
        <div className="flex-1 relative">
          <VideoGrid />

          {/* 화면 공유 알림 (화면 공유가 있을 때만) */}
          {hasActiveScreenShare && !isScreenShareViewerOpen && (
            <motion.div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => setIsScreenShareViewerOpen(true)}
                className="bg-[#2C2C2E]/90 backdrop-blur-sm text-[#FFFFFF] px-4 py-2 rounded-lg border border-[#424245] hover:bg-[#424245] transition-colors"
              >
                🖥️ {activeScreenShareCount}개의 화면이 공유 중 - 클릭하여 보기
              </button>
            </motion.div>
          )}
        </div>

        {/* 하단 컨트롤 */}
        <BottomControls />
      </motion.main>

      {/* 채팅 사이드바 - 오버레이 방식 */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="absolute top-0 right-0 h-full w-[400px] z-50"
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <ChatSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 화면 공유 뷰어 - 전체화면 오버레이 */}
      <ScreenShareViewer
        isVisible={isScreenShareViewerOpen && hasActiveScreenShare}
        onClose={() => setIsScreenShareViewerOpen(false)}
      />
    </div>
  );
};
