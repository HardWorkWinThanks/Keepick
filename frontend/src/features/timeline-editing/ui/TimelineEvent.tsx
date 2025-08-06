"use client";

import Image from "next/image";
import {
  CalendarDaysIcon,
  MapPinIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { TimelineEvent as TimelineEventType } from "@/entities/album";
import { Photo } from "@/entities/photo";
import { EmojiPicker } from "./EmojiPicker";

interface TimelineEventProps {
  event: TimelineEventType;
  isDraggedOver: boolean;
  // editingEmojiEventId: string | null;
  // emojiOptions: string[];
  // emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  onFieldChange: (
    eventId: string,
    field: keyof TimelineEventType,
    value: string
  ) => void;
  onRemovePhoto: (eventId: string, photo: Photo) => void;
  // onEmojiClick: (eventId: string) => void;
  // onEmojiSelect: (eventId: string, emoji: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, eventId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, eventId: string) => void;
  onDragLeave: () => void;
}

export function TimelineEvent({
  event,
  isDraggedOver,
  // editingEmojiEventId,
  // emojiOptions,
  // emojiPickerRef,
  onFieldChange,
  onRemovePhoto,
  // onEmojiClick,
  // onEmojiSelect,
  onDragOver,
  onDrop,
  onDragLeave,
}: TimelineEventProps) {
  return (
    <div className="relative pl-8 mb-10">
      {/* 이모지 버튼 */}
      {/* <div
        className="absolute -left-1.5 top-5 w-8 h-8 rounded-full bg-white flex items-center    
  justify-center cursor-pointer"
        onClick={() => onEmojiClick(event.id)}
      >
        <span className="text-xl">{event.emoji}</span>
      </div> */}

      {/* 이모지 선택 팝업 */}
      {/* <EmojiPicker
        isOpen={editingEmojiEventId === event.id}
        emojiOptions={emojiOptions}
        onEmojiSelect={(emoji) => onEmojiSelect(event.id, emoji)}
        // emojiPickerRef={emojiPickerRef}
      /> */}

      <div
        onDragOver={(e) => onDragOver(e, event.id)}
        onDrop={(e) => onDrop(e, event.id)}
        onDragLeave={onDragLeave}
        className={`bg-white rounded-lg shadow-md p-5 transition-all duration-300 ${
          isDraggedOver ? "shadow-2xl ring-2 ring-teal-400" : ""
        }`}
      >
        <input
          type="text"
          value={event.title}
          onChange={(e) => onFieldChange(event.id, "title", e.target.value)}
          className="text-2xl font-bold text-gray-900 w-full bg-transparent focus:outline-none focus:bg-gray-50 rounded p-1 mb-2"
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-4 h-4" />
            <input
              type="text"
              value={event.date}
              onChange={(e) => onFieldChange(event.id, "date", e.target.value)}
              className="bg-transparent focus:outline-none focus:bg-gray-50 rounded p-1   w-28"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="w-4 h-4" />
            <input
              type="text"
              value={event.location}
              onChange={(e) =>
                onFieldChange(event.id, "location", e.target.value)
              }
              className="bg-transparent focus:outline-none focus:bg-gray-50 rounded p-1"
            />
          </div>
        </div>

        <div
          className={`p-3 bg-gray-50/70 rounded-md min-h-[110px] border-2 border-dashed        
  transition-colors ${isDraggedOver ? "border-teal-400" : "border-gray-200"}`}
        >
          {event.photos.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {event.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <Image
                    src={photo.src}
                    alt={photo.name || photo.id}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-md shadow-sm"
                  />
                  <button
                    onClick={() => onRemovePhoto(event.id, photo)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white
  rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
  transition-opacity z-10"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">
              이곳에 사진을 드래그하세요
            </p>
          )}
        </div>

        <div className="mt-4">
          <textarea
            value={event.description}
            onChange={(e) =>
              onFieldChange(event.id, "description", e.target.value)
            }
            placeholder="이날의 이야기를 기록해보세요..."
            className="w-full text-gray-700 bg-gray-50 rounded-md p-3 text-sm focus:ring-2     
  focus:ring-teal-500 focus:outline-none transition"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
