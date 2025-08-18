// src/widgets/chat/MessageInput.tsx
"use client";

import { useRef, useCallback } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
}
export const MessageInput = ({
  value,
  onChange,
  onSend,
  placeholder = "메시지를 입력하세요...",
}: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const isComposingRef = useRef(false); // IME 조합 상태 추가

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const maxHeight = 120;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + "px";
  }, []);

  const handleTyping = useCallback(
    (newValue: string) => {
      onChange(newValue);
      requestAnimationFrame(adjustHeight);

      const isCurrentlyTyping = newValue.length > 0;

      if (isCurrentlyTyping !== isTypingRef.current) {
        isTypingRef.current = isCurrentlyTyping;
        console.log(`[TYPING] MessageInput: 상태 전송: ${isCurrentlyTyping}`);
        chatSocketHandler.setTypingStatus(isCurrentlyTyping);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isCurrentlyTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (isTypingRef.current) {
            isTypingRef.current = false;
            console.log("[TYPING] MessageInput: 타임아웃으로 false 전송");
            chatSocketHandler.setTypingStatus(false);
          }
        }, 2000);
      }
    },
    [onChange, adjustHeight]
  );

  const handleSend = useCallback(() => {
    const messageToSend = value.trim();
    if (messageToSend) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        chatSocketHandler.setTypingStatus(false);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      console.log(`💬 [MessageInput] Sending: "${messageToSend}"`);
      onSend();
    }
  }, [value, onSend]);

  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTyping(e.target.value)}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onKeyDown={(e) => {
            // IME 조합 중일 때는 Enter 이벤트 무시
            if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-[#222222] text-[#FFFFFF] placeholder-[#A0A0A5] border border-[#424245] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FE7A25] transition-colors scrollbar-hide leading-tight"
          rows={1}
          style={{
            maxHeight: "120px",
            fontFamily: "Line-Seed, sans-serif",
            minHeight: "40px",
          }}
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="p-2 w-10 h-10 flex items-center justify-center bg-[#FE7A25] hover:bg-[#E06B1F] disabled:bg-[#424245] disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
        >
          <PaperAirplaneIcon className="w-5 h-5 text-[#222222]" />
        </button>
      </div>
    </div>
  );
};
