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
        localStorage.setItem(`albumCover_${albumId}`, coverPhoto.originalUrl);
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
   * 개발 및 테스트용 기본 사진 데이터 목록을 반환합니다. (더미 데이터 제거)
   * @returns 빈 Photo 객체 배열 - 실제 데이터는 API에서 로드
   */
  const getDefaultPhotos = (): Photo[] => [];

  // 훅이 제공하는 함수들을 객체 형태로 반환합니다.
  return {
    saveAlbumData,
    loadAlbumData,
    getDefaultPhotos,
  };
}