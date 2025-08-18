import { Photo } from "@/entities/photo";

// 티어별로 사진 목록을 관리하는 데이터 구조입니다.
// 키는 티어의 레이블(예: "S", "A")이며, 값은 해당 티어에 속한 사진 객체의 배열입니다.
export interface TierData {
  [key: string]: Photo[];
}

// '정밀 배틀' 모드 진행 상황을 관리하는 데이터 구조입니다.
export interface BattleSequence {
  newPhoto: Photo; // 새로 등급을 매길 사진
  opponents: Photo[]; // 비교 대상이 될 사진들 (같은 티어 내)
  currentOpponentIndex: number; // 현재 비교 중인 상대 사진의 인덱스
  targetTier: string; // 목표로 하는 티어
  targetIndex: number; // 해당 티어 내에서 목표로 하는 위치
  sourceType: string; // 드래그 시작된 사진의 출처 (예: 'available' 또는 다른 티어)
}

// 사진을 드래그할 때, 어느 티어의 어느 위치 위에 마우스가 있는지 나타내는 데이터 구조입니다.
export interface DragOverPosition {
  tier: string; // 대상 티어
  index: number; // 해당 티어 내에서의 인덱스
}

// 각 티어의 설정 정보를 담는 데이터 구조입니다.
export interface TierConfig {
  label: string; // 티어 이름 (S, A, B...)
  color: string; // 티어 표시를 위한 CSS 색상 값 (예: Tailwind CSS 그라데이션 클래스)
}