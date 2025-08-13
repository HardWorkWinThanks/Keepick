// src/widgets/chat/ChatSidebar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleChat, markAsRead } from "@/entities/chat/model/slice";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export const ChatSidebar = () => {
  const dispatch = useAppDispatch();
  const { messages } = useAppSelector((state) => state.chat);
  const { userName } = useAppSelector((state) => state.session);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 채팅창이 열릴 때 읽음 처리
  useEffect(() => {
    dispatch(markAsRead());
  }, [dispatch]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // chatSocketHandler를 통해 메시지 전송 (간단한 형태로)
      chatSocketHandler.sendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full bg-[#2C2C2E] border-l border-[#424245] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-[#424245]">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftIcon className="w-5 h-5 text-[#FE7A25]" />
          <h3 className="text-[#FFFFFF] font-semibold font-header">채팅</h3>
        </div>
        <button
          onClick={() => dispatch(toggleChat())}
          className="p-1 rounded-lg hover:bg-[#424245] transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-[#A0A0A5]" />
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t border-[#424245]">
        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
        />
      </div>
    </div>
  );
};
