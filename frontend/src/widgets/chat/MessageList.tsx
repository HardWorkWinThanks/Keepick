// src/widgets/chat/MessageList.tsx
"use client";

import { ChatMessage } from "@/entities/chat/model/slice";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { UserIcon } from "@heroicons/react/24/solid";

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#A0A0A5] p-8">
        <UserIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center">채팅을 시작해보세요!</p>
        <p className="text-sm text-center mt-2 opacity-75">
          다른 참가자들과 실시간으로 소통할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id}>
          {message.type === "system" ? (
            <SystemMessage message={message} />
          ) : (
            <UserMessage message={message} />
          )}
        </div>
      ))}
    </div>
  );
};

const SystemMessage = ({ message }: { message: ChatMessage }) => (
  <div className="text-center">
    <span className="text-[#A0A0A5] text-sm bg-[#222222] px-3 py-1 rounded-full">
      {message.content}
    </span>
  </div>
);

const UserMessage = ({ message }: { message: ChatMessage }) => {
  const isCurrentUser = message.sender?.id === "current-user"; // TODO: 실제 현재 사용자 ID 비교

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isCurrentUser ? "order-2" : "order-1"}`}>
        {/* 발신자 이름 (다른 사용자인 경우만) */}
        {!isCurrentUser && (
          <div className="text-[#A0A0A5] text-xs mb-1 px-2">
            {message.sender?.name}
          </div>
        )}

        {/* 메시지 버블 */}
        <div
          className={`px-3 py-2 rounded-2xl ${
            isCurrentUser
              ? "bg-[#FE7A25] text-[#222222]"
              : "bg-[#424245] text-[#FFFFFF]"
          }`}
        >
          <p className="break-words">{message.content}</p>
        </div>

        {/* 시간 */}
        <div
          className={`text-xs text-[#A0A0A5] mt-1 px-2 ${
            isCurrentUser ? "text-right" : "text-left"
          }`}
        >
          {format(new Date(message.timestamp), "HH:mm", { locale: ko })}
        </div>
      </div>
    </div>
  );
};
