// src/widgets/chat/ChatSidebar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleChat, markAsRead } from "@/entities/chat/model/slice";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";
import { XMarkIcon, ChatBubbleLeftIcon, UserIcon } from "@heroicons/react/24/solid";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";

export const ChatSidebar = () => {
  const dispatch = useAppDispatch();
  const { messages, participants, participantsCount } = useAppSelector((state) => state.chat);
  const { userName, roomId } = useAppSelector((state) => state.session);
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

  // 채팅 상태 확인용 로그 (실제 초기화는 joinRoomThunk에서 처리됨)
  useEffect(() => {
    console.log(`💬 [ChatSidebar] Chat state - roomId: ${roomId}, userName: ${userName}`);
    // joinRoomThunk에서 이미 chatSocketHandler.setRoomInfo를 호출하므로 여기서는 중복 호출하지 않음
  }, [roomId, userName]);

  const handleSendMessage = () => {
    const messageToSend = newMessage.trim();
    if (messageToSend) {
      console.log(`💬 [SIDEBAR] Sending message: "${messageToSend}"`);
      // 먼저 입력 필드를 클리어
      setNewMessage("");
      // 그 다음 메시지 전송
      chatSocketHandler.sendMessage(messageToSend);
    }
  };


  // 현재 참여자 수 (나 + 다른 참여자들)
  const totalParticipants = 1 + participants.length;

  return (
    <div className="h-full bg-[#2C2C2E] border-l border-[#424245] flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-[#424245]">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftIcon className="w-5 h-5 text-[#FE7A25]" />
          <div>
            <h3 className="text-[#FFFFFF] font-semibold font-header">채팅</h3>
            <p className="text-xs text-[#A0A0A5]">{totalParticipants}명 참여 중</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(toggleChat())}
          className="p-1 rounded-lg hover:bg-[#424245] transition-colors"
          aria-label="채팅 닫기"
        >
          <XMarkIcon className="w-5 h-5 text-[#A0A0A5]" />
        </button>
      </div>

      {/* 참여자 목록 (개선된 버전) */}
      <div className="px-4 py-2 border-b border-[#424245]">
        <div className="flex items-center space-x-2 text-xs text-[#A0A0A5]">
          <UserIcon className="w-4 h-4" />
          <span>
            {userName} (나)
            {participants.length > 0 && (
              <span>
                , {participants.filter(p => p.name !== userName).map(p => 
                  p.isTyping ? `${p.name} (입력 중...)` : p.name
                ).join(", ")}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <MessageList />

        {/* 타이핑 인디케이터 */}
        <TypingIndicator className="px-4 py-2" />

        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t border-[#424245]">
        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          placeholder="메시지를 입력하세요..."
        />
      </div>
    </div>
  );
};
