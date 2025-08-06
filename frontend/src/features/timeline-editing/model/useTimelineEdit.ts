"use client";

import { useState } from "react";
import { TimelineEvent } from "@/entities/album";
import { Photo } from "@/entities/photo";

/**
 * 타임라인 앨범의 편집과 관련된 상태와 로직을 관리하는 커스텀 훅입니다.
 * 이벤트 추가/수정, 사진 추가/삭제, 드래그 앤 드롭 등의 기능을 포함합니다.
 * @param initialEvents - 훅 초기화 시 사용될 기본 타임라인 이벤트 목록
 * @returns 타임라인 편집 관련 상태와 핸들러 함수들을 반환합니다.
 */
export function useTimelineEdit(initialEvents: TimelineEvent[] = []) {
  // 타임라인 이벤트 목록을 관리하는 상태
  const [timelineEvents, setTimelineEvents] =
    useState<TimelineEvent[]>(initialEvents);
  // 사진을 드래그할 때, 마우스가 올라가 있는 이벤트 카드의 ID를 추적하는 상태
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);

  /**
   * 이벤트의 특정 필드(제목, 날짜 등) 값을 변경하는 핸들러입니다.
   * @param eventId - 수정할 이벤트의 ID
   * @param field - 수정할 필드의 이름 (TimelineEvent의 key)
   * @param value - 새로운 값
   */
  const handleFieldChange = (
    eventId: string,
    field: keyof TimelineEvent,
    value: string
  ) => {
    setTimelineEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, [field]: value } : event
      )
    );
  };

  /**
   * 새로운 타임라인 이벤트를 추가하는 핸들러입니다.
   */
  const handleAddEvent = () => {
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`, // 고유 ID 생성
      title: "새로운 추억",
      date: new Date().toISOString().split("T")[0].replaceAll("-", "."),
      location: "어디에서?",
      emoji: "😊",
      description: "",
      photos: [],
    };
    setTimelineEvents((prev) => [...prev, newEvent]);
  };

  /**
   * 특정 이벤트에 사진을 추가하는 핸들러입니다.
   * @param eventId - 사진을 추가할 이벤트의 ID
   * @param photo - 추가할 사진 객체
   */
  const handleAddPhotoToEvent = (eventId: string, photo: Photo) => {
    setTimelineEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, photos: [...event.photos, photo] }
          : event
      )
    );
  };

  /**
   * 이벤트에서 특정 사진을 제거하는 핸들러입니다.
   * @param eventId - 사진을 제거할 이벤트의 ID
   * @param photoToRemove - 제거할 사진 객체
   */
  const handleRemovePhotoFromEvent = (
    eventId: string,
    photoToRemove: Photo
  ) => {
    setTimelineEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              photos: event.photos.filter((p) => p.id !== photoToRemove.id),
            }
          : event
      )
    );
  };

  // --- 드래그 앤 드롭 핸들러 ---

  /**
   * 사진을 드래그하여 이벤트 카드 위로 올렸을 때 호출됩니다.
   */
  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    eventId: string
  ) => {
    e.preventDefault(); // 드롭을 허용하도록 기본 동작 방지
    setDragOverEventId(eventId); // 드래그 오버 상태 업데이트
  };

  /**
   * 사진을 이벤트 카드 위에 드롭했을 때 호출됩니다.
   * @param e - 드래그 이벤트 객체
   * @param targetEventId - 드롭 대상 이벤트의 ID
   * @returns 드롭된 사진 데이터를 반환하여, 부모 컴포넌트에서 'availablePhotos' 목록에서 제거할 수 있도록 합니다.
   */
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetEventId: string
  ) => {
    e.preventDefault();
    // 드래그 데이터에서 사진 정보를 파싱합니다.
    const photoData = JSON.parse(e.dataTransfer.getData("photo")) as Photo;
    handleAddPhotoToEvent(targetEventId, photoData);
    setDragOverEventId(null); // 드래그 오버 상태 초기화
    return photoData;
  };

  /**
   * 드래그하던 사진이 이벤트 카드 영역을 벗어났을 때 호출됩니다.
   */
  const handleDragLeave = () => {
    setDragOverEventId(null);
  };

  return {
    timelineEvents,
    setTimelineEvents,
    dragOverEventId,
    handleFieldChange,
    handleAddEvent,
    handleAddPhotoToEvent,
    handleRemovePhotoFromEvent,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  };
}