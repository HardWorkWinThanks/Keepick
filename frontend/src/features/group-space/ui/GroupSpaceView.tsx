"use client";

import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGroupSpace } from "../model/useGroupSpace";
import { PhotoGallery } from "@/features/photo-gallery";
import type { Group } from "@/entities/group";
import Image from "next/image";

interface GroupSpaceViewProps {
  group: Group;
}

export default function GroupSpaceView({ group }: GroupSpaceViewProps) {
  const router = useRouter();
  const {
    currentMode,
    currentAlbum,
    currentPhotos,
    visiblePhotos,
    currentPhotoIndex,
    isAnimating,
    changeMainMode,
    changeAlbumType,
    navigatePhotos,
  } = useGroupSpace();

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-8">
      {/* Album/Gallery Mode Section - 메인 섹션으로 이동, 크기와 색상 조정 */}
      <div className="px-8 pt-6 pb-4 pl-20">
        <div className="flex items-start gap-4">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentMode.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="text-6xl md:text-7xl lg:text-8xl font-keepick-primary font-bold tracking-wider text-white"
            >
              {currentMode.name}
            </motion.h1>
          </AnimatePresence>

          {/* Mode Navigation Arrows - flexbox로 텍스트 옆에 자동 정렬 */}
          <div className="flex flex-col gap-2 mt-2 ml-4">
            <button
              onClick={() => changeMainMode("up")}
              disabled={isAnimating}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-all duration-300 disabled:opacity-50 text-white"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={() => changeMainMode("down")}
              disabled={isAnimating}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-all duration-300 disabled:opacity-50 text-white"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col">
        <AnimatePresence mode="wait">
          {currentMode.id === "album" ? (
            <motion.div
              key="album"
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1],
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 },
              }}
            >
              {/* Album Mode - Photo Gallery Section */}
              <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="relative w-full">
                  {/* Left Navigation Button */}
                  <button
                    onClick={() => navigatePhotos("left")}
                    disabled={currentPhotoIndex === 0}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                      currentPhotoIndex === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-white/10 text-[#FE7A25]"
                    }`}
                  >
                    <ChevronLeft size={28} />
                  </button>

                  {/* Right Navigation Button */}
                  <button
                    onClick={() => navigatePhotos("right")}
                    disabled={currentPhotoIndex >= currentPhotos.length - 4}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                      currentPhotoIndex >= currentPhotos.length - 4
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-white/10 text-[#FE7A25]"
                    }`}
                  >
                    <ChevronRight size={28} />
                  </button>

                  {/* Photos Grid */}
                  <div className="mx-16">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${currentAlbum.id}-${currentPhotoIndex}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="grid grid-cols-4 gap-4 w-full"
                      >
                        {visiblePhotos.map((photo, index) => (
                          <motion.div
                            key={photo.id}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: index * 0.1,
                              ease: "easeOut",
                            }}
                            className="group cursor-pointer w-full"
                            onMouseEnter={() => {
                              // 앨범 타입에 따라 다른 라우트로 사전 로딩
                              if (currentAlbum.id === "timeline") {
                                router.prefetch(
                                  `/group/${group.groupId}/timeline/${photo.id}`
                                );
                              } else if (currentAlbum.id === "tier") {
                                router.prefetch(
                                  `/group/${group.groupId}/tier/${photo.id}`
                                );
                              }
                            }}
                            onClick={() => {
                              // 앨범 타입에 따라 다른 라우트로 이동
                              if (currentAlbum.id === "timeline") {
                                router.push(
                                  `/group/${group.groupId}/timeline/${photo.id}`
                                );
                              } else if (currentAlbum.id === "tier") {
                                router.push(
                                  `/group/${group.groupId}/tier/${photo.id}`
                                );
                              } else if (currentAlbum.id === "highlight") {
                                // TODO: 하이라이트 앨범 라우트 구현 예정  
                                alert(`하이라이트 앨범 "${photo.title}"는 아직 구현 중입니다.`);
                              }
                            }}
                          >
                            <div className="relative aspect-[4/5] overflow-hidden bg-[#222222]/50 rounded-sm w-full border border-white/10">
                              <Image
                                src={photo.image || "/placeholder.svg"}
                                alt={photo.title}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                priority={index < 4}
                              />
                            </div>

                            <div className="mt-6 space-y-2">
                              {/* 날짜 표시 - 타임라인 앨범일 때만 */}
                              {currentAlbum.id === "timeline" && (
                                <p className="text-sm text-[#FE7A25] font-keepick-primary tracking-wider">
                                  2024.03.15 ~ 2024.03.20
                                </p>
                              )}
                              <h3 className="text-lg font-medium text-white/90 group-hover:text-[#FE7A25] transition-colors">
                                {photo.title}
                              </h3>
                              <p className="text-base text-white/60 uppercase tracking-wider">
                                {photo.subtitle}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Album Controls */}
              <div className="relative px-8 pb-8">
                <div className="flex justify-end items-end">
                  {/* Album Type with Navigation */}
                  <div className="flex items-start gap-4">
                    {/* Album Type Text */}
                    <div className="text-right">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentAlbum.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="flex flex-col items-end"
                        >
                          {/* 영어 메인 제목 */}
                          <h2 className="text-6xl md:text-7xl lg:text-8xl font-keepick-heavy tracking-wider text-[#FE7A25] leading-none">
                            {currentAlbum.name}
                          </h2>
                          {/* 한글 부제목 */}
                          <p className="text-lg md:text-xl lg:text-2xl font-keepick-primary font-medium text-[#F5E7C6] mt-2 tracking-wide">
                            {currentAlbum.subtitle}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation Arrows - flexbox로 텍스트 옆에 자동 정렬 */}
                    <div className="flex flex-col gap-2 mt-2 ml-4">
                      <button
                        onClick={() => changeAlbumType("up")}
                        disabled={isAnimating}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-all duration-300 disabled:opacity-50 text-[#FE7A25]"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => changeAlbumType("down")}
                        disabled={isAnimating}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-all duration-300 disabled:opacity-50 text-[#FE7A25]"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                {/* <div className="absolute bottom-0 right-8 flex items-center gap-2 text-xs text-white/40">
            <span>
              {currentPhotoIndex + 1}-{Math.min(currentPhotoIndex + 4, currentPhotos.length)}
            </span>
            <span>/</span>
            <span>{currentPhotos.length}</span>
          </div> */}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1],
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 },
              }}
            >
              {/* Gallery Mode - PhotoGallery 컴포넌트 */}
              <div className="flex-1">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <PhotoGallery groupId={group.groupId.toString()} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
