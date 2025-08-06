"use client";

import { useState } from "react";
import { TimelineEvent } from "@/entities/album";
import { Photo } from "@/entities/photo";

export function useTimelineEdit(initialEvents: TimelineEvent[] = []) {
  const [timelineEvents, setTimelineEvents] =
    useState<TimelineEvent[]>(initialEvents);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);

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

  const handleAddEvent = () => {
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      title: "새로운 추억",
      date: new Date().toISOString().split("T")[0].replaceAll("-", "."),
      location: "어디에서?",
      emoji: "😊",
      description: "",
      photos: [],
    };
    setTimelineEvents((prev) => [...prev, newEvent]);
  };

  const handleAddPhotoToEvent = (eventId: string, photo: Photo) => {
    setTimelineEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, photos: [...event.photos, photo] }
          : event
      )
    );
  };

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

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    eventId: string
  ) => {
    e.preventDefault();
    setDragOverEventId(eventId);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetEventId: string
  ) => {
    e.preventDefault();
    const photoData = JSON.parse(e.dataTransfer.getData("photo")) as Photo;
    handleAddPhotoToEvent(targetEventId, photoData);
    setDragOverEventId(null);
    return photoData; // 호출자가 availablePhotos에서 제거할 수 있도록
  };

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
