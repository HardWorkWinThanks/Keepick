"use client";

import type React from "react";

import { useState, useRef } from "react";
import Header from "@/components/layout/header";

type FilterType =
  | "all"
  | "people"
  | "food"
  | "place"
  | "trash"
  | "blurry"
  | "duplicate"
  | "similar";

export default function PhotosPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { type: "all", icon: "🖼️", label: "모든 사진" },
    { type: "people", icon: "👥", label: "인물" },
    { type: "food", icon: "🍽️", label: "음식" },
    { type: "place", icon: "📍", label: "장소" },
    { type: "trash", icon: "🗑️", label: "휴지통" },
    { type: "blurry", icon: "🌫️", label: "흐린 사진" },
    { type: "duplicate", icon: "📚", label: "중복 사진" },
    { type: "similar", icon: "🔗", label: "유사 사진" },
  ];

  const allPhotos = [
    {
      id: 1,
      src: "/placeholder.svg?height=200&width=200&text=사진1",
      tags: ["김지민", "파스타", "레스토랑"],
      type: "all",
    },
    {
      id: 2,
      src: "/placeholder.svg?height=200&width=200&text=사진2",
      tags: ["이수현", "샐러드", "카페"],
      type: "all",
    },
    {
      id: 3,
      src: "/placeholder.svg?height=200&width=200&text=사진3",
      tags: ["박건우", "초밥", "도쿄"],
      type: "all",
    },
    {
      id: 4,
      src: "/placeholder.svg?height=200&width=200&text=사진4",
      tags: ["한국의궁궐"],
      type: "all",
    },
  ];

  const trashPhotos = [
    {
      id: 5,
      src: "/placeholder.svg?height=200&width=200&text=삭제된+사진1",
      tags: [],
      type: "trash",
    },
    {
      id: 6,
      src: "/placeholder.svg?height=200&width=200&text=삭제된+사진2",
      tags: [],
      type: "trash",
    },
  ];

  const blurryPhotos = [
    {
      id: 7,
      src: "/placeholder.svg?height=200&width=200&text=흐린+사진1",
      tags: ["흐림"],
      type: "blurry",
    },
  ];

  const duplicatePhotos = [
    {
      id: 8,
      src: "/placeholder.svg?height=200&width=200&text=중복+사진1",
      tags: ["중복"],
      type: "duplicate",
    },
    {
      id: 9,
      src: "/placeholder.svg?height=200&width=200&text=중복+사진1(복사본)",
      tags: ["중복"],
      type: "duplicate",
    },
  ];

  const similarPhotos = [
    {
      id: 10,
      src: "/placeholder.svg?height=200&width=200&text=유사+사진1-A",
      tags: ["유사"],
      type: "similar",
    },
    {
      id: 11,
      src: "/placeholder.svg?height=200&width=200&text=유사+사진1-B",
      tags: ["유사"],
      type: "similar",
    },
  ];

  const getPhotosForFilter = (filter: FilterType) => {
    switch (filter) {
      case "trash":
        return trashPhotos;
      case "blurry":
        return blurryPhotos;
      case "duplicate":
        return duplicatePhotos;
      case "similar":
        return similarPhotos;
      default:
        return allPhotos;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log(`${files.length}개의 파일이 드롭되었습니다.`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log(`${files.length}개의 파일이 선택되었습니다.`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePhoto = (photoId: number) => {
    console.log("Deleting photo:", photoId);
  };

  const handleRestorePhoto = (photoId: number) => {
    console.log("Restoring photo:", photoId);
  };

  const handlePermanentDelete = (photoId: number) => {
    if (confirm("이 사진을 영구 삭제하시겠습니까? 복구할 수 없습니다!")) {
      console.log("Permanently deleting photo:", photoId);
    }
  };

  const currentPhotos = getPhotosForFilter(activeFilter);

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] p-6 flex flex-col gap-6 overflow-y-auto">
      <Header variant="app" currentPage="photos" />

      {/* Upload Section */}
      <section className="bg-white rounded-3xl shadow-lg p-8 text-center">
        <div
          className={`border-3 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver
              ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5"
              : "border-[var(--border-color)] hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)]/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <span
            className={`text-6xl mb-4 transition-colors ${
              dragOver
                ? "text-[var(--primary-color)]"
                : "text-gray-300 hover:text-[var(--primary-color)]"
            }`}
          >
            📤
          </span>
          <p className="text-lg text-gray-500">
            사진을 여기에 드래그하거나 클릭하여 업로드
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </section>

      {/* Photo Management Section */}
      <section className="bg-white rounded-3xl shadow-lg p-6 flex-1 flex flex-col min-h-96">
        <h2 className="font-montserrat text-2xl font-bold text-[var(--text-dark)] mb-6 pb-2 border-b-2 border-[var(--border-color)]">
          내 사진
        </h2>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b border-[var(--border-color)]">
          {filters.map((filter) => (
            <button
              key={filter.type}
              onClick={() => setActiveFilter(filter.type as FilterType)}
              className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                activeFilter === filter.type
                  ? "bg-[var(--primary-color)] text-white shadow-lg -translate-y-0.5"
                  : "border border-[var(--border-color)] text-gray-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] hover:-translate-y-0.5"
              }`}
            >
              <span>{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sub-filters for specific categories */}
        {(activeFilter === "people" ||
          activeFilter === "food" ||
          activeFilter === "place") && (
          <div className="mb-4">
            <select className="w-52 p-3 border border-[var(--border-color)] rounded-2xl text-base text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)] transition-colors bg-white">
              {activeFilter === "people" && (
                <>
                  <option value="all-people">전체 인물</option>
                  <option value="kim-jimin">김지민</option>
                  <option value="lee-suhyun">이수현</option>
                  <option value="park-gunwoo">박건우</option>
                </>
              )}
              {activeFilter === "food" && (
                <>
                  <option value="all-food">전체 음식</option>
                  <option value="salad">샐러드</option>
                  <option value="pasta">파스타</option>
                  <option value="sushi">초밥</option>
                  <option value="korean-food">한식</option>
                </>
              )}
              {activeFilter === "place" && (
                <>
                  <option value="all-place">전체 장소</option>
                  <option value="opera-house">오페라하우스</option>
                  <option value="korean-palace">한국의 궁궐</option>
                  <option value="cafe">카페</option>
                  <option value="beach">해변</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* Photo Grid */}
        <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 pr-2 -mr-2 overflow-y-auto">
          {currentPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-md transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer relative group flex flex-col ${
                photo.type === "trash"
                  ? "border-2 border-red-500"
                  : photo.type === "blurry"
                  ? "border-2 border-orange-500"
                  : photo.type === "duplicate"
                  ? "border-2 border-purple-500"
                  : photo.type === "similar"
                  ? "border-2 border-blue-500"
                  : ""
              }`}
            >
              <img
                src={photo.src || "/placeholder.svg"}
                alt={`Photo ${photo.id}`}
                className="w-full h-40 object-cover transition-transform group-hover:scale-105"
              />

              {/* Photo Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Photo info:", photo.id);
                  }}
                  className="w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                  title="정보"
                >
                  <span className="text-sm">ℹ️</span>
                </button>

                {photo.type === "trash" ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestorePhoto(photo.id);
                      }}
                      className="w-8 h-8 bg-green-500/70 text-white rounded-full flex items-center justify-center hover:bg-green-500/90 transition-colors"
                      title="복원"
                    >
                      <span className="text-sm">↩️</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermanentDelete(photo.id);
                      }}
                      className="w-8 h-8 bg-red-600/70 text-white rounded-full flex items-center justify-center hover:bg-red-600/90 transition-colors"
                      title="영구 삭제"
                    >
                      <span className="text-sm">🗑️</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    className="w-8 h-8 bg-red-500/70 text-white rounded-full flex items-center justify-center hover:bg-red-500/90 transition-colors"
                    title="삭제"
                  >
                    <span className="text-sm">🗑️</span>
                  </button>
                )}
              </div>

              {/* Photo Tags */}
              {photo.tags.length > 0 && (
                <div className="p-3 flex flex-wrap gap-1 bg-white border-t border-[var(--border-color)]">
                  {photo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-xs px-2 py-1 rounded font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
