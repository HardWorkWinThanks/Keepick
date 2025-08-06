import { Photo } from "@/entities/photo";
import { TimelineEvent } from "@/entities/album";

// 타임라인 편집 UI의 전체 상태를 나타내는 인터페이스입니다.
export interface TimelineEditingState {
  timelineEvents: TimelineEvent[]; // 현재 타임라인에 표시되는 이벤트 목록
  dragOverEventId: string | null; // 사진을 드래그할 때, 마우스가 올라가 있는 이벤트의 ID
}

// 이모지 선택기(Picker) UI의 상태를 나타내는 인터페이스입니다.
export interface EmojiPickerState {
  isOpen: boolean; // 이모지 선택기가 열려있는지 여부
  eventId: string | null; // 어떤 이벤트에 대한 이모지를 변경 중인지 식별하는 ID
  position?: { x: number; y: number }; // 화면에 표시될 위치 (선택 사항)
}