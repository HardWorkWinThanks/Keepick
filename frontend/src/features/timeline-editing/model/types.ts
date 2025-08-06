import { Photo } from "@/entities/photo";
import { TimelineEvent } from "@/entities/album";

export interface TimelineEditingState {
  timelineEvents: TimelineEvent[];
  dragOverEventId: string | null;
  // editingEmojiEventId: string | null;
}

export interface EmojiPickerState {
  isOpen: boolean;
  eventId: string | null;
  position?: { x: number; y: number };
}
