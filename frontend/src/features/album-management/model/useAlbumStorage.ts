"use client";

import { Photo } from "@/entities/photo";
import { AlbumData, LoadAlbumDataResult } from "./types";

export function useAlbumStorage() {
  const saveAlbumData = (
    albumId: string,
    data: AlbumData,
    coverPhoto?: Photo
  ): boolean => {
    try {
      localStorage.setItem(`album_${albumId}`, JSON.stringify(data));
      if (coverPhoto) {
        localStorage.setItem(`albumCover_${albumId}`, coverPhoto.src);
      }
      return true;
    } catch (error) {
      console.error("Failed to save album data:", error);
      return false;
    }
  };

  const loadAlbumData = (albumId: string): LoadAlbumDataResult => {
    try {
      const savedData = localStorage.getItem(`album_${albumId}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        return { success: true, data };
      } else {
        return { success: false, error: "No saved data found" };
      }
    } catch (error) {
      console.error("Failed to load album data:", error);
      return { success: false, error: "Failed to parse saved data" };
    }
  };

  const getDefaultPhotos = (): Photo[] => [
    { id: "photo1", src: "/ssafy-dummy1.jpg", name: "사진1" },
    { id: "photo2", src: "/ssafy-dummy2.jpg", name: "사진2" },
    { id: "photo3", src: "/ssafy-dummy3.jpg", name: "사진3" },
    { id: "photo4", src: "/ssafy-dummy4.jpg", name: "사진4" },
    { id: "photo5", src: "/dummy/dummy1.jpg", name: "사진5" },
    { id: "photo6", src: "/dummy/dummy2.jpg", name: "사진6" },
    { id: "photo7", src: "/dummy/dummy3.jpg", name: "사진7" },
    { id: "photo8", src: "/dummy/dummy4.jpg", name: "사진8" },
    { id: "photo9", src: "/dummy/dummy5.jpg", name: "사진9" },
    { id: "photo10", src: "/dummy/dummy6.jpg", name: "사진10" },
    { id: "photo11", src: "/dummy/dummy7.jpg", name: "사진11" },
    { id: "photo12", src: "/dummy/dummy8.jpg", name: "사진12" },
  ];

  return {
    saveAlbumData,
    loadAlbumData,
    getDefaultPhotos,
  };
}
