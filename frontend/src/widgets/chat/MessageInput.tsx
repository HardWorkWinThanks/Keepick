// src/widgets/chat/MessageInput.tsx
"use client";

import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder?: string;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  placeholder = "메시지를 입력하세요...",
}: MessageInputProps) => {
  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          className="w-full bg-[#222222] text-[#FFFFFF] placeholder-[#A0A0A5] border border-[#424245] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FE7A25] transition-colors no-scrollba"
          rows={1}
          style={{
            maxHeight: "120px",
            fontFamily: "Line-Seed, sans-serif",
          }}
          onInput={(e) => {
            // 자동 높이 조절
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            // maxHeight 값을 style에서 직접 가져와 일관성 유지
            const maxHeight = parseInt(target.style.maxHeight) || 120;
            target.style.height = Math.min(target.scrollHeight, maxHeight) + "px";
          }}
        />
      </div>

      <button
        onClick={onSend}
        disabled={!value.trim()}
        // ◀◀◀ 수정된 부분: 버튼의 높이를 textarea와 맞추기 위해 패딩을 조절합니다.
        className="p-2 h-10 w-10 flex items-center justify-center bg-[#FE7A25] hover:bg-[#E06B1F] disabled:bg-[#424245] disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
      >
        <PaperAirplaneIcon className="w-5 h-5 text-[#222222]" />
      </button>
    </div>
  );
};
