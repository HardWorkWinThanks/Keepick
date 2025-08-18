import { useState } from "react";
import { Photo } from "@/entities/photo";

/**
 * 사진 상세보기 모달의 상태와 동작을 관리하는 커스텀 훅입니다.
 * 모달의 열림/닫힘 상태와 현재 선택된 사진 정보를 관리합니다.
 * @returns 모달 상태 및 제어 함수들을 반환합니다.
 */
export function usePhotoModal() {
  // 현재 모달에 표시될 사진 정보를 저장하는 상태
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  // 모달의 열림/닫힘 여부를 저장하는 상태
  const [isOpen, setIsOpen] = useState(false);

  /**
   * 특정 사진을 인자로 받아 모달을 엽니다.
   * @param photo - 모달에 표시할 사진 객체
   */
  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsOpen(true);
  };

  /**
   * 모달을 닫습니다.
   */
  const closeModal = () => {
    setSelectedPhoto(null);
    setIsOpen(false);
  };

  return {
    photo: selectedPhoto, // 현재 선택된 사진
    isOpen, // 모달 열림 상태
    openModal, // 모달을 여는 함수
    closeModal, // 모달을 닫는 함수
  };
}