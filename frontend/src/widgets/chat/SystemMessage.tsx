// src/widgets/chat/SystemMessage.tsx
"use client";

import { ChatMessage } from "@/entities/chat/model/slice";
import {
  InformationCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

interface SystemMessageProps {
  message: ChatMessage;
}

export const SystemMessage = ({ message }: SystemMessageProps) => {
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

  // 메시지 내용에 따라 아이콘 결정
  const getIcon = () => {
    const content = message.content.toLowerCase();

    if (content.includes("입장") || content.includes("joined")) {
      return <UserPlusIcon className="w-4 h-4 text-[#4ade80]" />;
    }

    if (content.includes("퇴장") || content.includes("left")) {
      return <UserMinusIcon className="w-4 h-4 text-[#f87171]" />;
    }

    if (content.includes("오류") || content.includes("error")) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-[#fbbf24]" />;
    }

    return <InformationCircleIcon className="w-4 h-4 text-[#60a5fa]" />;
  };

  // 메시지 내용에 따라 색상 결정
  const getTextColor = () => {
    const content = message.content.toLowerCase();

    if (content.includes("입장") || content.includes("joined")) {
      return "text-[#4ade80]";
    }

    if (content.includes("퇴장") || content.includes("left")) {
      return "text-[#f87171]";
    }

    if (content.includes("오류") || content.includes("error")) {
      return "text-[#fbbf24]";
    }

    return "text-[#A0A0A5]";
  };

  return (
    <div className="flex justify-center my-4">
      <div className="flex items-center space-x-2 bg-[#222222] px-3 py-2 rounded-full border border-[#424245]">
        {/* 아이콘 */}
        {getIcon()}

        {/* 메시지 내용 */}
        <span className={`text-sm ${getTextColor()}`}>{message.content}</span>

        {/* 시간 */}
        <span className="text-xs text-[#666666] ml-2">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};
