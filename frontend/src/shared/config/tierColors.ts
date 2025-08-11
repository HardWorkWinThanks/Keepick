/**
 * 티어 색상 상수 관리
 * 프로젝트 전체에서 사용되는 티어별 색상을 중앙에서 관리합니다.
 */

export const TIER_COLORS = {
  S: '#FF8000', // 주황색
  A: '#A335EE', // 보라색
  B: '#0070DD', // 파란색
  C: '#AB8A65', // 베이지/브라운 색상
  D: '#7A7B7E', // 회색
} as const;

export type TierType = keyof typeof TIER_COLORS;

/**
 * 티어 타입에 따른 색상을 반환하는 유틸리티 함수
 */
export const getTierColor = (tier: TierType): string => {
  return TIER_COLORS[tier];
};