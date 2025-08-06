"use client";

import { useState } from "react";
import { Photo } from "@/entities/photo";

/**
 * 앨범 관리와 관련된 UI 상태를 관리하는 커스텀 훅입니다.
 * 사진 목록, 이미지 상세보기 모달 등 컴포넌트의 상태 로직을 캡슐화합니다.
 * @returns 앨범 관련 상태와 상태를 변경하는 함수들을 반환합니다.
 */
export function useAlbumState() {
  // 앨범에 아직 배치되지 않은, 사용 가능한 사진 목록 상태
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([]);

  // 사용자가 클릭하여 상세히 볼 사진의 정보 상태
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);

  // 이미지 상세보기 모달의 표시 여부 상태
  const [showImageModal, setShowImageModal] = useState(false);

  /**
   * 사진을 클릭했을 때 호출되는 핸들러입니다.
   * 선택된 사진 정보를 상태에 저장하고, 모달을 엽니다.
   * @param photo - 사용자가 클릭한 사진 객체
   */
  const handleImageClick = (photo: Photo) => {
    setSelectedImage(photo);
    setShowImageModal(true);
  };

  /**
   * 이미지 상세보기 모달을 닫을 때 호출되는 핸들러입니다.
   * 선택된 사진 정보를 초기화하고, 모달을 닫습니다.
   */
  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // 관리하는 상태와 핸들러 함수들을 반환하여 컴포넌트에서 사용할 수 있도록 합니다.
  return {
    availablePhotos,
    setAvailablePhotos,
    selectedImage,
    showImageModal,
    handleImageClick,
    handleCloseImageModal,
  };
}