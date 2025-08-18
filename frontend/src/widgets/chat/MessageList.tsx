// src/widgets/chat/MessageList.tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { UserMessage } from "./UserMessage";
import { SystemMessage } from "./SystemMessage";

export const MessageList = () => {
  const messages = useAppSelector((state) => state.chat.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 처리 로직을 useMemo로 최적화
  const processedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    // 1. ID 기준으로 중복 제거 (최신 메시지 우선)
    const messageMap = new Map();

    messages.forEach((message) => {
      const existing = messageMap.get(message.id);

      if (!existing) {
        messageMap.set(message.id, message);
      } else {
        // 기존 메시지가 임시이고 새 메시지가 확정이면 교체
        if (existing.isTemporary && !message.isTemporary) {
          messageMap.set(message.id, message);
        }
        // 둘 다 확정이면 더 최신 timestamp로 교체
        else if (!existing.isTemporary && !message.isTemporary) {
          if (new Date(message.timestamp) > new Date(existing.timestamp)) {
            messageMap.set(message.id, message);
          }
        }
      }
    });

    // 2. 시간순 정렬
    const uniqueMessages = Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log(`💬 [MessageList] 처리된 메시지 수: ${uniqueMessages.length}/${messages.length}`);
    return uniqueMessages;
  }, [messages]);

  // 새 메시지가 올 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (processedMessages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100); // 약간의 지연을 두어 렌더링 완료 후 스크롤

      return () => clearTimeout(timer);
    }
  }, [processedMessages.length]);

  if (processedMessages.length === 0) {
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
      {processedMessages.map((message) => (
        <div
          key={message.id} // ID만으로 충분 (중복 제거했으므로)
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
