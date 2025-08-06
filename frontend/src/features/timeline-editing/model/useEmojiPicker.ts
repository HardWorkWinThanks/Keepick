"use client";

import { useState, useRef, useEffect } from "react";

export function useEmojiPicker() {
  const [editingEmojiEventId, setEditingEmojiEventId] = useState<string | null>(
    null
  );
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  const emojiOptions = ["🥰", "🥳", "✈️", "😂", "😢", "🤔", "😎", "🎉"];

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setEditingEmojiEventId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openEmojiPicker = (eventId: string) => {
    setEditingEmojiEventId(eventId);
  };

  const closeEmojiPicker = () => {
    setEditingEmojiEventId(null);
  };

  const selectEmoji = (
    emoji: string,
    onEmojiSelect: (emoji: string) => void
  ) => {
    onEmojiSelect(emoji);
    closeEmojiPicker();
  };

  return {
    editingEmojiEventId,
    emojiOptions,
    emojiPickerRef,
    openEmojiPicker,
    closeEmojiPicker,
    selectEmoji,
  };
}
