// src/widgets/chat/TypingIndicator.tsx
"use client";

import { useState, useEffect } from "react";
import { UserIcon } from "@heroicons/react/24/solid";

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = ({ className = "" }: TypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    // 타이핑 상태 수신 이벤트 리스너
    const handleUserTyping = (event: CustomEvent) => {
      const { participantId, participantName, isTyping } = event.detail;

      setTypingUsers((prev) => {
        if (isTyping) {
          // 타이핑 시작 - 사용자 추가 (중복 제거)
          const exists = prev.find((user) => user.id === participantId);
          if (exists) {
            // 이미 있으면 타임스탬프만 업데이트
            return prev.map((user) =>
              user.id === participantId
                ? { ...user, timestamp: Date.now() }
                : user
            );
          } else {
            // 새로운 사용자 추가
            return [
              ...prev,
              {
                id: participantId,
                name: participantName,
                timestamp: Date.now(),
              },
            ];
          }
        } else {
          // 타이핑 중지 - 사용자 제거
          return prev.filter((user) => user.id !== participantId);
        }
      });
    };

    // 사용자 정의 이벤트 리스너 등록
    window.addEventListener(
      "chatUserTyping",
      handleUserTyping as EventListener
    );

    // 타이머 - 5초 이상 업데이트가 없으면 자동 제거
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((user) => now - user.timestamp < 5000)
      );
    }, 1000);

    return () => {
      window.removeEventListener(
        "chatUserTyping",
        handleUserTyping as EventListener
      );
      clearInterval(cleanupInterval);
    };
  }, []);

  if (typingUsers.length === 0) {
    return null;
  }

  const renderTypingText = () => {
    const count = typingUsers.length;
    const names = typingUsers.map((user) => user.name);

    if (count === 1) {
      return `${names[0]}님이 입력 중`;
    } else if (count === 2) {
      return `${names[0]}님과 ${names[1]}님이 입력 중`;
    } else {
      return `${names[0]}님 외 ${count - 1}명이 입력 중`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 ${className}`}>
      <div className="flex-shrink-0 w-6 h-6 bg-[#424245] rounded-full flex items-center justify-center">
        <UserIcon className="w-4 h-4 text-[#A0A0A5]" />
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-[#A0A0A5]">{renderTypingText()}</span>

        {/* 타이핑 애니메이션 도트 */}
        <div className="flex space-x-1">
          <div
            className="w-1 h-1 bg-[#A0A0A5] rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-1 h-1 bg-[#A0A0A5] rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-1 h-1 bg-[#A0A0A5] rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};
