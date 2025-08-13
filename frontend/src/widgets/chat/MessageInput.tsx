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
          className="w-full bg-[#222222] text-[#FFFFFF] placeholder-[#A0A0A5] border border-[#424245] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FE7A25] transition-colors"
          rows={1}
          style={{
            minHeight: "40px",
            maxHeight: "120px",
            fontFamily: "Line-Seed, sans-serif",
          }}
          onInput={(e) => {
            // 자동 높이 조절
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 120) + "px";
          }}
        />
      </div>

      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="p-2 bg-[#FE7A25] hover:bg-[#E06B1F] disabled:bg-[#424245] disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        <PaperAirplaneIcon className="w-5 h-5 text-[#222222]" />
      </button>
    </div>
  );
};
