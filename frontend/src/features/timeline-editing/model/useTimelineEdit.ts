"use client";

import { useState } from "react";
import { TimelineEvent } from "@/entities/album";
import { Photo, DragPhotoData } from "@/entities/photo";

export interface TimelineEditState {
  timelineEvents: TimelineEvent[];
  isEditing: boolean;
  dragOverEventId: string | null;
  selectedEventId: string | null;
}

export interface TimelineEditHandlers {
  handleToggleEdit: () => void;
  handleFieldChange: (eventId: string, field: keyof TimelineEvent, value: string) => void;
  handleAddEvent: () => void;
  handleDeleteEvent: (eventId: string) => void;
  handleAddPhotoToEvent: (eventId: string, photo: Photo) => void;
  handleRemovePhotoFromEvent: (eventId: string, photoId: string) => void;
  handleDragOver: (eventId: string) => void;
  handleDragLeave: () => void;
  handleDrop: (eventId: string, dragData: DragPhotoData) => void;
  handleSelectEvent: (eventId: string | null) => void;
}

/**
 * 타임라인 앨범의 편집과 관련된 상태와 로직을 관리하는 커스텀 훅입니다.
 * 이벤트 추가/수정/삭제, 사진 추가/삭제, 드래그 앤 드롭 등의 기능을 포함합니다.
 * @param initialEvents - 훅 초기화 시 사용될 기본 타임라인 이벤트 목록
 * @returns 타임라인 편집 관련 상태와 핸들러 함수들을 반환합니다.
 */
export function useTimelineEdit(initialEvents: TimelineEvent[] = []) {
  // 타임라인 편집 상태 관리
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialEvents);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
   * 편집 모드를 토글하는 핸들러입니다.
   */
  const handleToggleEdit = () => {
    setIsEditing(prev => !prev);
    setSelectedEventId(null);
  };

  /**
   * 새로운 타임라인 이벤트를 추가하는 핸들러입니다.
   */
  const handleAddEvent = () => {
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      title: "새로운 추억",
      subtitle: "NEW MEMORY",
      date: new Date().toISOString().split("T")[0].replaceAll("-", "."),
      description: "여기에 추억을 적어보세요...",
      photos: [],
      images: [],
    };
    setTimelineEvents(prev => [...prev, newEvent]);
    setSelectedEventId(newEvent.id);
  };

  /**
   * 이벤트를 삭제하는 핸들러입니다.
   */
  const handleDeleteEvent = (eventId: string) => {
    setTimelineEvents(prev => prev.filter(event => event.id !== eventId));
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    }
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
   * @param photoId - 제거할 사진의 ID
   */
  const handleRemovePhotoFromEvent = (eventId: string, photoId: string) => {
    setTimelineEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? {
              ...event,
              photos: event.photos.filter(p => p.id !== photoId),
            }
          : event
      )
    );
  };

  /**
   * 이벤트를 선택하는 핸들러입니다.
   */
  const handleSelectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  // --- 드래그 앤 드롭 핸들러 ---

  /**
   * 드래그 오버 핸들러
   */
  const handleDragOver = (eventId: string) => {
    setDragOverEventId(eventId);
  };

  /**
   * 드래그 리브 핸들러
   */
  const handleDragLeave = () => {
    setDragOverEventId(null);
  };

  /**
   * 드롭 핸들러
   */
  const handleDrop = (eventId: string, dragData: DragPhotoData) => {
    // 실제로는 상위 컴포넌트에서 사진 객체를 찾아서 전달해야 함
    // 여기서는 기본 구조만 제공
    const photo: Photo = {
      id: dragData.photoId,
      src: "", // 실제 구현에서는 찾아서 채워야 함
      name: "",
    };
    
    handleAddPhotoToEvent(eventId, photo);
    setDragOverEventId(null);
  };

  const state: TimelineEditState = {
    timelineEvents,
    isEditing,
    dragOverEventId,
    selectedEventId,
  };

  const handlers: TimelineEditHandlers = {
    handleToggleEdit,
    handleFieldChange,
    handleAddEvent,
    handleDeleteEvent,
    handleAddPhotoToEvent,
    handleRemovePhotoFromEvent,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSelectEvent,
  };

  return {
    state,
    handlers,
    // 편의를 위한 개별 export
    ...state,
    ...handlers,
  };
}