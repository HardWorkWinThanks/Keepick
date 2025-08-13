// src/widgets/chat/MessageList.tsx
"use client";

import { useRef, useEffect } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { UserMessage } from "./UserMessage";
import { SystemMessage } from "./SystemMessage";

export const MessageList = () => {
  const messages = useAppSelector((state) => state.chat.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 올 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 중복 메시지 제거 (혹시 모를 상황을 위한 추가 보안)
  const uniqueMessages = messages.reduce((acc, message) => {
    const existingIndex = acc.findIndex((m) => m.id === message.id);
    if (existingIndex >= 0) {
      // 이미 존재하는 메시지라면 더 최신 정보로 교체 (임시 -> 확정)
      if (!acc[existingIndex].isTemporary || message.isTemporary === false) {
        acc[existingIndex] = message;
      }
    } else {
      acc.push(message);
    }
    return acc;
  }, [] as typeof messages);

  // 시간순 정렬
  const sortedMessages = uniqueMessages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log(`💬 [MessageList] Rendering ${sortedMessages.length} messages`);

  if (sortedMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#A0A0A5] p-8">
        <div className="text-center">
          <p className="text-lg mb-2">💬</p>
          <p>아직 메시지가 없습니다.</p>
          <p className="text-sm mt-1">첫 번째 메시지를 보내보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {sortedMessages.map((message, index) => (
        <div
          key={`${message.id}-${index}`} // ID + index로 완전히 고유한 키 보장
          className={message.isTemporary ? "opacity-70" : ""}
        >
          {message.type === "system" ? (
            <SystemMessage message={message} />
          ) : (
            <UserMessage message={message} isTemporary={message.isTemporary} />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
