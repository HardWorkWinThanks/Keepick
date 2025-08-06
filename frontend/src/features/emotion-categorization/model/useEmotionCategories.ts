"use client";

import { useState } from "react";
import { Photo } from "@/entities/photo";
import { emotionCategories } from "./emotionCategories";

export function useEmotionCategories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleImageClick = (image: Photo) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const activeCategoryData = emotionCategories.find(
    (cat) => cat.id === selectedCategory
  );

  return {
    emotionCategories,
    selectedCategory,
    selectedImage,
    activeCategoryData,
    handleCategoryClick,
    handleImageClick,
    handleCloseModal,
  };
}
