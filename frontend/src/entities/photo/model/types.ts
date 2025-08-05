export interface Photo {
  id: string;
  src: string;
  name?: string;
}

export interface CreatePhotoInput {
  id: string;
  src: string;
  name?: string;
}

export interface DragPhotoData {
  photoId: string;
  source: string | "available";
}
