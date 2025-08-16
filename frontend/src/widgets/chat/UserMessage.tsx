// src/widgets/chat/UserMessage.tsx
"use client";

import { ChatMessage } from "@/entities/chat/model/slice";
import { useAppSelector } from "@/shared/hooks/redux";
import { gestureHandler, chatHandler, webrtcHandler } from "@/shared/api/socket";
import { UserIcon, ClockIcon } from "@heroicons/react/24/solid";

interface UserMessageProps {
  message: ChatMessage;
  isTemporary?: boolean;
}

export const UserMessage = ({
  message,
  isTemporary = false,
}: UserMessageProps) => {
  const { userName } = useAppSelector((state) => state.session);
  
  // 내 메시지 판별: sender.name과 현재 사용자 이름 비교
  const isOwnMessage = message.sender?.name === userName || message.sender?.id === "current-user";
  
  // 디버깅용 로그 (필요시 주석 해제)
  // console.log(`💬 [UserMessage] Message from ${message.sender?.name}, current user: ${userName}, isOwnMessage: ${isOwnMessage}`);

  const formatTime = (timestamp: Date | string | number) => {
    try {
      // timestamp가 다양한 형태일 수 있으므로 안전하게 Date 객체로 변환
      let date: Date;

      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else if (typeof timestamp === "number") {
        date = new Date(timestamp);
      } else {
        console.warn("Invalid timestamp format:", timestamp);
        return new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Date 객체가 유효한지 확인
      if (isNaN(date.getTime())) {
        console.warn("Invalid date created from timestamp:", timestamp);
        return new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`flex max-w-xs lg:max-w-md ${
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        } items-start ${isOwnMessage ? "space-x-reverse space-x-2" : "space-x-2"}`}
      >
        {/* 프로필 아이콘 (상대방 메시지일 때만) */}
        {!isOwnMessage && (
          <div className="flex-shrink-0 w-8 h-8 bg-[#424245] rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-[#A0A0A5]" />
          </div>
        )}

        <div
          className={`flex flex-col ${
            isOwnMessage ? "items-end" : "items-start"
          }`}
        >
          {/* 사용자 이름 (상대방 메시지일 때만) */}
          {!isOwnMessage && (
            <span className="text-xs text-[#A0A0A5] mb-1 px-2">
              {message.sender?.name || "Unknown"}
            </span>
          )}

          {/* 메시지 버블 */}
          <div
            className={`relative px-4 py-2 rounded-2xl max-w-full break-words ${
              isOwnMessage
                ? "bg-[#FE7A25] text-white"
                : "bg-[#424245] text-[#FFFFFF]"
            } ${isTemporary ? "opacity-70" : ""}`}
          >
            {/* 메시지 내용 */}
            <div className="text-sm leading-relaxed">{message.content}</div>

            {/* 임시 메시지 로딩 표시 */}
            {isTemporary && (
              <div className="absolute -bottom-1 -right-1">
                <ClockIcon className="w-3 h-3 text-[#A0A0A5] animate-pulse" />
              </div>
            )}
          </div>

          {/* 시간 표시 */}
          <span
            className={`text-xs text-[#A0A0A5] mt-1 px-2 ${
              isOwnMessage ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.timestamp)}
            {isTemporary && (
              <span className="ml-1 text-[#A0A0A5]">전송 중...</span>
            )}
          </span>
        </div>

        {/* 프로필 아이콘 (내 메시지일 때) */}
        {isOwnMessage && (
          <div className="flex-shrink-0 w-8 h-8 bg-[#FE7A25] rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};
