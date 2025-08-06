"use client";

import { useState, useRef, useEffect } from "react";

/**
 * 타임라인 이벤트의 이모지를 선택하고 변경하는 UI 로직을 관리하는 커스텀 훅입니다.
 * @returns 이모지 선택기 관련 상태와 핸들러 함수들을 반환합니다.
 */
export function useEmojiPicker() {
  // 현재 이모지를 편집 중인 타임라인 이벤트의 ID를 저장하는 상태
  const [editingEmojiEventId, setEditingEmojiEventId] = useState<string | null>(
    null
  );
  // 이모지 선택기 DOM 요소를 참조하기 위한 ref
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // 선택 가능한 기본 이모지 목록
  const emojiOptions = ["🥰", "🥳", "✈️", "😂", "😢", "🤔", "😎", "🎉"];

  // 이모지 선택기 외부를 클릭했을 때 선택기를 닫기 위한 Effect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // 클릭된 요소가 이모지 선택기 내부에 있지 않으면
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        // 이모지 편집 상태를 종료합니다 (선택기 닫기).
        setEditingEmojiEventId(null);
      }
    }
    // 전역 클릭 이벤트 리스너 등록
    document.addEventListener("mousedown", handleClickOutside);
    // 컴포넌트 언마운트 시 리스너 제거
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * 특정 이벤트에 대한 이모지 선택기를 엽니다.
   * @param eventId - 편집을 시작할 이벤트의 ID
   */
  const openEmojiPicker = (eventId: string) => {
    setEditingEmojiEventId(eventId);
  };

  /**
   * 이모지 선택기를 닫습니다.
   */
  const closeEmojiPicker = () => {
    setEditingEmojiEventId(null);
  };

  /**
   * 사용자가 이모지를 선택했을 때 호출되는 핸들러입니다.
   * @param emoji - 선택된 이모지
   * @param onEmojiSelect - 선택된 이모지를 실제 데이터에 반영하기 위한 콜백 함수
   */
  const selectEmoji = (
    emoji: string,
    onEmojiSelect: (emoji: string) => void
  ) => {
    onEmojiSelect(emoji); // 콜백을 통해 부모 컴포넌트의 상태 업데이트
    closeEmojiPicker(); // 이모지 선택기 닫기
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