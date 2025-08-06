import { Photo } from "@/entities/photo";

/**
 * 앨범 관리 기능의 최상위 컴포넌트가 받는 props 타입을 정의합니다.
 */
export interface AlbumManagementProps {
  albumId: string; // 현재 관리 중인 앨범의 고유 ID
  albumTitle: string; // 앨범 제목
  onBack: () => void; // '뒤로가기' 동작을 처리할 함수
}

/**
 * 앨범 데이터를 저장하고 불러올 때 사용하는 기본 데이터 구조입니다.
 * 다양한 앨범 타입(타임라인, 티어 등)을 지원하기 위해 확장 가능한 형태로 정의되었습니다.
 */
export interface AlbumData {
  availablePhotos: Photo[]; // 앨범에 아직 배치되지 않은 사진 목록
  [key: string]: unknown; // 다른 앨범 타입(TierData, TimelineEvent[] 등)의 데이터를 추가로 포함할 수 있도록 함
}

/**
 * `useAlbumStorage` 훅의 `loadAlbumData` 함수가 반환하는 결과 타입을 정의합니다.
 */
export interface LoadAlbumDataResult {
  success: boolean; // 데이터 로드 성공 여부
  data?: AlbumData; // 성공 시, 불러온 앨범 데이터
  error?: string; // 실패 시, 에러 메시지
}