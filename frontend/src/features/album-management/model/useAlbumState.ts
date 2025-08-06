"use client";

import { useState } from "react";
import { Photo } from "@/entities/photo";

export function useAlbumState() {
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([]);
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleImageClick = (photo: Photo) => {
    setSelectedImage(photo);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  return {
    availablePhotos,
    setAvailablePhotos,
    selectedImage,
    showImageModal,
    handleImageClick,
    handleCloseImageModal,
  };
}
