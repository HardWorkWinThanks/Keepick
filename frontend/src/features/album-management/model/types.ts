import { Photo } from "@/entities/photo";

export interface AlbumManagementProps {
  albumId: string;
  albumTitle: string;
  onBack: () => void;
}

export interface AlbumData {
  availablePhotos: Photo[];
  [key: string]: unknown; // 다른 앨범 타입들의 확장 가능
}

export interface LoadAlbumDataResult {
  success: boolean;
  data?: AlbumData;
  error?: string;
}
