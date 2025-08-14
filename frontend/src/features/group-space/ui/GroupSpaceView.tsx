"use client";

import { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGroupSpace } from "../model/useGroupSpace";
import { PhotoGallery } from "@/features/photo-gallery";
import { InteractiveHoverButton } from "@/shared/ui/composite";
import type { Group } from "@/entities/group";
import Image from "next/image";

interface GroupSpaceViewProps {
  group: Group;
}

export default function GroupSpaceView({ group }: GroupSpaceViewProps) {
  const router = useRouter();
  // 앨범 생성 버튼 클릭 여부를 추적하는 상태
  const [isFromAlbumCreateButton, setIsFromAlbumCreateButton] = useState(false);
  
  const {
    currentMode,
    currentAlbum,
    currentPhotos,
    visiblePhotos,
    currentPhotoIndex,
    isAnimating,
    isLoading,
    hasNextPage,
    hasPrevPage,
    deletingAlbumId,
    changeMainMode,
    changeAlbumType,
    navigatePhotos,
    switchToGalleryMode,
    deleteAlbum,
    isDeletingAlbum,
  } = useGroupSpace(group.groupId);

  // 앨범 모드로 전환하거나 컴포넌트가 언마운트될 때 플래그 리셋
  useEffect(() => {
    if (currentMode.id === "album") {
      setIsFromAlbumCreateButton(false);
    }
  }, [currentMode.id]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      setIsFromAlbumCreateButton(false);
    };
  }, []);

  // 사이드바에서 썸네일 변경 요청 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SWITCH_TO_GALLERY_FOR_THUMBNAIL') {
        const { groupId } = event.data.data;
        
        // 현재 그룹과 메시지의 그룹 ID가 일치할 때만 처리
        if (groupId === group.groupId.toString()) {
          console.log('사이드바에서 썸네일 변경 요청 수신 - 갤러리 모드로 전환');
          switchToGalleryMode();
          
          // URL에 썸네일 선택 모드 파라미터 추가
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('mode', 'thumbnail');
          window.history.replaceState({}, '', currentUrl.toString());
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [group.groupId, switchToGalleryMode]);

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-8">
      {/* Album/Gallery Mode Section - 메인 섹션으로 이동, 크기와 색상 조정 */}
      <div className="px-8 pt-6 pb-4 pl-20">
        <div className="flex items-start justify-between">
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

          {/* 타임라인 앨범 생성 버튼 - 우상단 */}
          {currentMode.id === "album" && currentAlbum.id === "timeline" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <InteractiveHoverButton
                variant="ghost"
                size="md"
                onClick={() => {
                  console.log('타임라인 앨범 생성 버튼 클릭 - 갤러리 모드로 전환')
                  setIsFromAlbumCreateButton(true) // 앨범 생성 버튼 클릭 플래그 설정
                  switchToGalleryMode()
                }}
              >
                CREATE NEW ALBUM
              </InteractiveHoverButton>
            </motion.div>
          )}

        </div>
      </div>

      {/* Main Content - 고정 레이아웃 구조 */}
      <div className="relative flex flex-col min-h-[80vh]">
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
              className="flex-1"
            >
              {/* 상단 앨범 갤러리 섹션 - 고정 높이 */}
              <div className="h-[45vh] flex items-center justify-center px-4 py-6 relative">
                <div className="relative w-full max-w-6xl">
                  {/* Left Navigation Button */}
                  <button
                    onClick={() => navigatePhotos("left")}
                    disabled={!hasPrevPage}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                      !hasPrevPage
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-white/10 text-[#FE7A25]"
                    }`}
                  >
                    <ChevronLeft size={28} />
                  </button>

                  {/* Right Navigation Button */}
                  <button
                    onClick={() => navigatePhotos("right")}
                    disabled={!hasNextPage}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                      !hasNextPage
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-white/10 text-[#FE7A25]"
                    }`}
                  >
                    <ChevronRight size={28} />
                  </button>

                  {/* Photos Grid */}
                  <div className="mx-4 sm:mx-8 lg:mx-12">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${currentAlbum.id}-${currentPhotoIndex}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full relative"
                      >
                        {/* 로딩 상태 */}
                        {isLoading && (
                          <div className="col-span-full flex items-center justify-center py-16">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <h2 className="text-xl font-keepick-primary font-bold tracking-wider text-white/60">
                                타임라인 앨범을 불러오는 중...
                              </h2>
                            </div>
                          </div>
                        )}

                        {/* 앨범이 비어있을 때 배경 메시지 */}
                        {!isLoading && visiblePhotos.length === 0 && (
                          <div className="col-span-full flex items-center justify-center py-16">
                            <div className="text-center">
                              <h2 className="text-4xl md:text-5xl lg:text-6xl font-keepick-primary font-bold tracking-wider text-white/30 mb-4">
                                NO ALBUMS
                              </h2>
                              {/* <p className="text-sm text-white/40 font-keepick-primary tracking-wide">
                                아직 생성된 앨범이 없습니다
                              </p> */}
                            </div>
                          </div>
                        )}

                        {/* 실제 앨범들 */}
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
                            className="group cursor-pointer w-full relative"
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
                              } else if (currentAlbum.id === "highlight") {
                                // 임시 - 하이라이트 앨범 사전 로딩
                                router.prefetch(
                                  `/group/${group.groupId}/highlight/${photo.id}`
                                );
                              }
                            }}
                          >
                            <div 
                              className="relative aspect-[3/4] overflow-hidden bg-[#222222]/50 rounded-sm w-full border border-white/10"
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
                                  // 임시 - 하이라이트 앨범 라우팅 (실제 API 연동 후 수정 예정)
                                  router.push(
                                    `/group/${group.groupId}/highlight/${photo.id}`
                                  );
                                }
                              }}
                            >
                              <Image
                                src={photo.image || "/placeholder/photo-placeholder.svg"}
                                alt={photo.title || '앨범 제목을 작성해주세요'}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                priority={index < 4}
                              />
                              
                              {/* 삭제 버튼 - 타임라인 앨범에만 표시 */}
                              {currentAlbum.id === "timeline" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (window.confirm(`"${photo.title}" 앨범을 삭제하시겠습니까?`)) {
                                      deleteAlbum(photo.id)
                                    }
                                  }}
                                  disabled={deletingAlbumId === photo.id || isDeletingAlbum}
                                  className={`absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 ${
                                    deletingAlbumId === photo.id ? 'animate-pulse' : ''
                                  }`}
                                  title="앨범 삭제"
                                >
                                  {deletingAlbumId === photo.id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 size={16} className="text-white" />
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="mt-6 space-y-2">
                              <h3 className="text-lg font-medium text-white/90 group-hover:text-[#FE7A25] transition-colors">
                                {photo.title || '앨범 제목을 작성해주세요'}
                              </h3>
                              <p className="text-base text-white/60 uppercase tracking-wider">
                                {photo.subtitle || '앨범 설명을 작성해주세요'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* 하단 앨범 타입 표시 섹션 - 고정 위치 */}
              <div className="h-[35vh] flex items-center justify-end px-8 pb-8">
                <div className="flex items-start gap-4">
                  {/* Album Type Text - 고정 위치 */}
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

                  {/* Navigation Arrows - 고정 위치 */}
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
                  <PhotoGallery 
                    groupId={group.groupId.toString()} 
                    autoEnterAlbumMode={isFromAlbumCreateButton}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
