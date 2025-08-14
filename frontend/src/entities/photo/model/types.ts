// 사진 엔티티의 기본 데이터 구조
export interface Photo {
  id: number; // 사진 고유 ID
  src: string; // 이미지 URL
  name?: string; // 사진 이름 (선택 사항)
}

// 사진을 드래그 앤 드롭할 때 전달되는 데이터
export interface DragPhotoData {
  photoId: number; // 드래그하는 사진의 ID
  source: string | "available"; // 사진의 출처 (어떤 앨범 뷰 또는 'available' 목록)
}

// 갤러리용 확장된 사진 타입
export interface GalleryPhoto {
  id: number;
  src: string;
  title: string;
  category: string;
  aspectRatio: number;
  width: number;
  height: number;
  date: string;
  tags: string[];
}

export interface PhotoTag {
  id: number;
  name: string;
  count?: number;
}

export interface PhotoFilter {
  tags: string[];
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PhotoSelection {
  selectedIds: number[];
  isSelectionMode: boolean;
}