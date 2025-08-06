"use client";

interface EmojiPickerProps {
  isOpen: boolean;
  emojiOptions: string[];
  onEmojiSelect: (emoji: string) => void;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
}

export function EmojiPicker({
  isOpen,
  emojiOptions,
  onEmojiSelect,
  emojiPickerRef,
}: EmojiPickerProps) {
  if (!isOpen) return null;

  return (
    <div
      ref={emojiPickerRef}
      className="absolute -left-2 top-14 bg-white rounded-lg shadow-lg p-2 grid grid-cols-4    
  gap-2 z-10"
    >
      {emojiOptions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className="text-2xl hover:bg-gray-100 rounded-md p-1"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
