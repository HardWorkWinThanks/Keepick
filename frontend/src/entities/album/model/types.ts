import { Photo } from "@/entities/photo";

// 타임라인 섹션 (기존 TimelineEvent 대체)
export interface TimelineSection {
  id: number; // 섹션 고유 ID
  name: string; // 섹션 제목 (예: "해변에서의 시간")
  description: string; // 섹션 설명
  startDate: string; // 시작 날짜 (YYYY-MM-DD)
  endDate: string; // 종료 날짜 (YYYY-MM-DD)
  photoIds: number[]; // 해당 섹션에 속한 사진 ID 목록
  photos?: (Photo | null)[]; // 실제 사진 데이터 (UI에서 사용, 인덱스 보존을 위해 null 허용)
}

// 타임라인 앨범
export interface TimelineAlbum {
  albumId: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  originalUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  photoCount: number;
  sections: TimelineSection[];
  unusedPhotos: Photo[]; // 앨범 생성 시 선택했지만 섹션에 사용하지 않은 사진들
  createdAt: string; // ISO 날짜
  updatedAt: string; // ISO 날짜
}

// 티어 배틀 진행 시, 사진을 배치하는 과정의 데이터 구조
export interface BattleSequence {
  newPhoto: Photo; // 새로 등급을 매길 사진
  opponents: Photo[]; // 비교 대상이 되는 사진들 (같은 티어 내)
  currentOpponentIndex: number; // 현재 비교하고 있는 사진의 인덱스
  targetTier: string; // 목표로 하는 티어 (예: "S", "A")
  targetIndex: number; // 해당 티어 내에서 목표로 하는 위치
  sourceType: string; // 사진의 출처 (예: 'available' - 아직 배치되지 않은 사진)
}

// 감정(분위기) 기반 사진 분류 데이터 구조
export interface EmotionCategory {
  id: string; // 카테고리 고유 ID
  title: string; // 카테고리 제목 (예: "행복", "활동적인")
  description: string; // 상세 설명
  icon: string; // 카테고리 대표 아이콘
  images: Photo[]; // 해당 카테고리에 속한 사진 목록
}

// 티어 뷰에서 사용될 데이터 구조. 티어(S, A, B 등)를 키로 가짐
export interface TierData {
  [key: string]: Photo[]; // 각 티어는 사진 배열을 값으로 가짐
}

// 드래그 앤 드롭 시, 마우스가 올라간 위치 정보
export interface DragOverPosition {
  tier: string; // 드롭될 티어
  index: number; // 해당 티어 내에서의 위치 인덱스
}