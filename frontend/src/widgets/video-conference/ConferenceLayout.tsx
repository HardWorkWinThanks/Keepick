// src/widgets/video-conference/ConferenceLayout.tsx
"use client";

import { useAppSelector } from "@/shared/hooks/redux";
import { VideoGrid } from "./VideoGrid";
import { BottomControls } from "./BottomControls";
import { ChatSidebar } from "@/widgets/chat/ChatSidebar";
import { motion, AnimatePresence } from "framer-motion";

export const ConferenceLayout = () => {
  const isChatOpen = useAppSelector((state) => state.chat.isChatOpen);

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
        <div className="flex-1 relative pb-6">
          <VideoGrid />
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

    </div>
  );
};
