// src/widgets/video-conference/ConferenceLayout.tsx
"use client";

import { useAppSelector } from "@/shared/hooks/redux";
import { VideoGrid } from "./VideoGrid";
import { BottomControls } from "./BottomControls";
import { ChatSidebar } from "@/widgets/chat/ChatSidebar";
import { AiResultsDisplay } from "./AiResultsDisplay";
import { motion, AnimatePresence } from "framer-motion";

export const ConferenceLayout = () => {
  const isChatOpen = useAppSelector((state) => state.chat.isChatOpen);

  return (
    // 전체 화면 컨테이너 (세로 방향 Flex)
    <div className="flex h-screen bg-[#222222] overflow-hidden">
      {/* ◀◀◀ 1. 메인 콘텐츠와 사이드바를 담는 '가로 방향' Flex 컨테이너 */}
      <div className="flex flex-1 overflow-hidden">
        {/* ◀◀◀ 2. 메인 콘텐츠 영역 (비디오 + 하단바) */}
        {/* 이 영역은 사이드바가 나타나면 자동으로 줄어듭니다. */}
        <div className="flex-1 flex flex-col min-w-0">
          {" "}
          {/* min-w-0은 flex 아이템이 줄어들 때 내용물이 넘치는 것을 방지합니다. */}
          {/* 비디오 그리드 영역 (남는 공간 모두 차지) */}
          <div className="flex-1 relative overflow-y-auto">
            <VideoGrid />
            {/* AI 결과 표시 컴포넌트 */}
            <AiResultsDisplay />
          </div>
          {/* 하단 컨트롤 (고정 높이) */}
          <BottomControls />
        </div>

        {/* ◀◀◀ 3. 채팅 사이드바 영역 */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              // 가로 너비를 0에서 400px로 애니메이션
              initial={{ width: 0 }}
              animate={{ width: 400 }}
              exit={{ width: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-shrink-0 bg-[#1a1a1a] overflow-hidden"
            >
              <ChatSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
