import { Photo } from "@/entities/photo";

// 타임라인 뷰에서 사용될 이벤트 데이터 구조
export interface TimelineEvent {
  id: string; // 이벤트 고유 ID
  title: string; // 이벤트 제목 (예: "제주도 여행")
  date: string; // 날짜
  location: string; // 장소
  emoji: string; // 이벤트 대표 이모지
  description: string; // 상세 설명
  photos: Photo[]; // 해당 이벤트에 속한 사진 목록
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