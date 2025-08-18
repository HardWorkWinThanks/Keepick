import { Photo } from "@/entities/photo";
import { EmotionCategory } from "@/entities/album";

export interface EmotionCategorizationState {
  selectedCategory: string | null;
  selectedImage: Photo | null;
}

export interface CategorySelectionProps {
  categories: EmotionCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string) => void;
}

export interface ImageGalleryProps {
  category: EmotionCategory;
  onImageClick: (image: Photo) => void;
}
