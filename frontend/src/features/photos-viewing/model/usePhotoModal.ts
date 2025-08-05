  import { useState } from "react";
  import { Photo } from "@/entities/photo";

  export function usePhotoModal() {
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const openModal = (photo: Photo) => {
      setSelectedPhoto(photo);
      setIsOpen(true);
    };

    const closeModal = () => {
      setSelectedPhoto(null);
      setIsOpen(false);
    };

    return {
      photo: selectedPhoto,
      isOpen,
      openModal,
      closeModal,
    };
  }

