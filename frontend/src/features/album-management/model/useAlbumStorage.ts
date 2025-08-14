"use client";

import { Photo } from "@/entities/photo";
import { AlbumData, LoadAlbumDataResult } from "./types";

/**
 * 앨범 데이터를 브라우저의 localStorage에 저장하고 불러오는 로직을 담당하는 커스텀 훅입니다.
 * 데이터 영속성 처리를 컴포넌트로부터 분리합니다.
 * @returns 앨범 데이터 저장, 로드, 기본값 제공 함수들을 반환합니다.
 */
export function useAlbumStorage() {
  /**
   * 앨범 데이터를 localStorage에 저장합니다.
   * @param albumId - 저장할 앨범의 고유 ID
   * @param data - 저장할 앨범 데이터 (예: 티어별 사진 목록, 타임라인 이벤트 목록 등)
   * @param coverPhoto - 앨범의 대표 이미지로 사용할 사진 (선택 사항)
   * @returns 저장 성공 시 true, 실패 시 false를 반환합니다.
   */
  const saveAlbumData = (
    albumId: string,
    data: AlbumData,
    coverPhoto?: Photo
  ): boolean => {
    try {
      // 앨범 ID를 키로 사용하여 데이터를 JSON 문자열 형태로 저장합니다.
      localStorage.setItem(`album_${albumId}`, JSON.stringify(data));
      // 대표 이미지가 있으면, 별도의 키로 이미지 URL을 저장합니다.
      if (coverPhoto) {
        localStorage.setItem(`albumCover_${albumId}`, coverPhoto.src);
      }
      return true;
    } catch (error) {
      console.error("Failed to save album data:", error);
      return false;
    }
  };

  /**
   * localStorage에서 앨범 데이터를 불러옵니다.
   * @param albumId - 불러올 앨범의 고유 ID
   * @returns 데이터 로드 성공 시 { success: true, data: ... }, 실패 시 { success: false, error: ... } 객체를 반환합니다.
   */
  const loadAlbumData = (albumId: string): LoadAlbumDataResult => {
    try {
      const savedData = localStorage.getItem(`album_${albumId}`);
      if (savedData) {
        // 저장된 데이터가 있으면 JSON으로 파싱하여 반환합니다.
        const data = JSON.parse(savedData);
        return { success: true, data };
      } else {
        // 저장된 데이터가 없을 경우
        return { success: false, error: "No saved data found" };
      }
    } catch (error) {
      console.error("Failed to load album data:", error);
      return { success: false, error: "Failed to parse saved data" };
    }
  };

  /**
   * 개발 및 테스트용 기본 사진 데이터 목록을 반환합니다.
   * @returns 기본 Photo 객체 배열
   * const getDefaultPhotos = (): Photo[] => [ 로 나중에 바꾸기.
   */
  const getDefaultPhotos = (): Photo[] => [
    { id: 12, src: "/dummy/main-dummy12.jpg", name: "사진12" },
    { id: 13, src: "/dummy/main-dummy13.jpg", name: "사진13" },
    { id: 14, src: "/dummy/main-dummy14.jpg", name: "사진14" },
    { id: 15, src: "/dummy/main-dummy15.jpg", name: "사진15" },
    { id: 16, src: "/dummy/main-dummy16.jpg", name: "사진16" },
    { id: 17, src: "/dummy/jeju-dummy1.webp", name: "제주도1" },
    { id: 18, src: "/dummy/jeju-dummy2.jpg", name: "제주도2" },
    { id: 19, src: "/dummy/jeju-dummy3.jpg", name: "제주도3" },
    { id: 20, src: "/dummy/ssafy-dummy1.jpg", name: "싸피1" },
    { id: 21, src: "/dummy/ssafy-dummy2.jpg", name: "싸피2" },
    { id: 22, src: "/dummy/ssafy-dummy3.jpg", name: "싸피3" },
    { id: 23, src: "/dummy/food-dummy1.jpg", name: "음식1" },
    { id: 24, src: "/dummy/sea-dummy1.jpg", name: "바다1" },
    { id: 25, src: "/dummy/ugly_00217.jpg", name: "ugly1" },
    { id: 26, src: "/dummy/ugly_074.jpg", name: "ugly2" },
    { id: 27, src: "/dummy/ugly.jpg", name: "ugly3" },
  ];

  // 훅이 제공하는 함수들을 객체 형태로 반환합니다.
  return {
    saveAlbumData,
    loadAlbumData,
    getDefaultPhotos,
  };
}