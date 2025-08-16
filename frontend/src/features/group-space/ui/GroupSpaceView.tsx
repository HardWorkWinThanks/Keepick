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
import { CreateAlbumButton, DeleteConfirmationModal } from "@/shared/ui/composite";
import type { Group } from "@/entities/group";
import Image from "next/image";

interface GroupSpaceViewProps {
  group: Group;
}

export default function GroupSpaceView({ group }: GroupSpaceViewProps) {
  const router = useRouter();
  // 앨범 생성 버튼 클릭 여부를 추적하는 상태
  const [isFromAlbumCreateButton, setIsFromAlbumCreateButton] = useState(false);
  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<{ id: number; title: string } | null>(null);
  
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
  
  // URL 파라미터로 갤러리 모드 자동 전환 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isGalleryMode = urlParams.get('gallery') === 'true';
    const mode = urlParams.get('mode');
    
    if (isGalleryMode) {
      console.log('갤러리 모드 파라미터 감지 - 갤러리로 전환');
      switchToGalleryMode();
      
      // 추가 모드나 다른 모드에 따른 처리
      if (mode) {
        console.log(`갤러리 모드: ${mode}`);
      }
    }
  }, [switchToGalleryMode]);

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

  // 삭제 확인 핸들러
  const handleDeleteConfirm = () => {
    if (albumToDelete) {
      deleteAlbum(albumToDelete.id);
      setDeleteModalOpen(false);
      setAlbumToDelete(null);
    }
  };

  // 삭제 모달 닫기 핸들러
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setAlbumToDelete(null);
  };

  return (
    <div className="bg-[#111111] text-white flex flex-col min-h-0" style={{ height: 'calc(100vh - 90px)' }}>
      {/* Album/Gallery Mode Section - 헤더 영역 */}
      <div className="px-8 py-6 pl-20 flex-shrink-0">
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

          {/* 앨범 생성 버튼 - 우상단 */}
          {currentMode.id === "album" && (currentAlbum.id === "timeline" || currentAlbum.id === "tier") && (
            <CreateAlbumButton
              albumType={currentAlbum.id}
              onCreateAlbum={() => {
                setIsFromAlbumCreateButton(true) // 앨범 생성 버튼 클릭 플래그 설정
                switchToGalleryMode()
              }}
            />
          )}

        </div>
      </div>

      {/* 상단 여백 - 헤더와 그리드 사이 */}
      <div style={{ flex: '1 1 0', minHeight: 0 }}></div>

      {/* Main Content - 그리드 영역 */}
      <div className="relative flex-shrink-0">
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
              className="flex-shrink-0"
            >
              {/* 상단 앨범 갤러리 섹션 - 완전 분리된 구조 */}
              <div className="relative w-full flex items-center justify-center">
                {/* Left Navigation Button - 완전히 독립된 위치 */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                  <button
                    onClick={() => navigatePhotos("left")}
                    disabled={!hasPrevPage}
                    className={`w-16 h-16 flex items-center justify-center transition-all duration-300 ${
                      !hasPrevPage
                        ? "opacity-30 cursor-not-allowed text-gray-600"
                        : "text-white hover:text-[#FE7A25] hover:scale-110"
                    }`}
                  >
                    <ChevronLeft size={32} />
                  </button>
                </div>

                {/* Right Navigation Button - 완전히 독립된 위치 */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                  <button
                    onClick={() => navigatePhotos("right")}
                    disabled={!hasNextPage}
                    className={`w-16 h-16 flex items-center justify-center transition-all duration-300 ${
                      !hasNextPage
                        ? "opacity-30 cursor-not-allowed text-gray-600"
                        : "text-white hover:text-[#FE7A25] hover:scale-110"
                    }`}
                  >
                    <ChevronRight size={32} />
                  </button>
                </div>

                {/* 그리드 컨테이너 - 화면 크기에 따른 동적 조정 */}
                <div className="relative w-full max-w-none mx-24 2xl:mx-32">

                  {/* Photos Grid */}
                  <div className="mx-1 lg:mx-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${currentAlbum.id}-${currentPhotoIndex}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 xl:gap-12 2xl:gap-16 w-full relative"
                      >
                        {/* 로딩 상태 */}
                        {isLoading && (
                          <div className="col-span-full flex items-center justify-center py-16">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <h2 className="text-xl font-keepick-primary font-bold tracking-wider text-white/60">
                                {currentAlbum.id === 'timeline' && '타임라인 앨범을 불러오는 중...'}
                                {currentAlbum.id === 'tier' && '티어 앨범을 불러오는 중...'}
                                {currentAlbum.id === 'highlight' && '하이라이트 앨범을 불러오는 중...'}
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
                                src={photo.originalUrl && photo.originalUrl.trim() ? photo.originalUrl : "/placeholder/photo-placeholder.svg"}
                                alt={photo.title || '앨범 제목을 작성해주세요'}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                priority={index < 4}
                              />
                              
                              {/* 호버시 제목, 설명, 날짜 오버레이 */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                {/* 날짜 정보 (타임라인 앨범에만 표시) */}
                                {currentAlbum.id === "timeline" && photo.startDate && photo.endDate && (
                                  <p className="text-xs text-[#FE7A25] font-medium mb-1 tracking-wide">
                                    {photo.startDate} ~ {photo.endDate}
                                  </p>
                                )}
                                <h3 className="text-lg font-medium text-white mb-2 leading-tight">
                                  {photo.title && photo.title.trim() ? photo.title : '앨범 제목을 작성해주세요'}
                                </h3>
                                <p className="text-sm text-white/80 uppercase tracking-wide leading-tight">
                                  {photo.subtitle && photo.subtitle.trim() ? photo.subtitle : '앨범 설명을 작성해주세요'}
                                </p>
                              </div>
                              
                              {/* 삭제 버튼 - 타임라인 앨범과 티어 앨범에 표시 */}
                              {(currentAlbum.id === "timeline" || currentAlbum.id === "tier") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setAlbumToDelete({ id: photo.id, title: photo.title || '제목 없는 앨범' })
                                    setDeleteModalOpen(true)
                                  }}
                                  disabled={deletingAlbumId === photo.id || isDeletingAlbum}
                                  className={`absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 ${
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
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
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
              className="flex-shrink-0"
            >
              {/* Gallery Mode - PhotoGallery 컴포넌트 */}
              <div className="flex flex-col">
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

      {/* 하단 여백 - 그리드와 푸터 사이 */}
      <div style={{ flex: '1.5 1 0', minHeight: 0 }}></div>

      {/* 하단 앨범 타입 표시 섹션 - 푸터 영역 */}
      {currentMode.id === "album" && (
        <div className="flex-shrink-0 flex items-center justify-end px-8 pt-4 pb-1 bg-[#111111] z-10">
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
                  <p className="text-lg md:text-xl lg:text-2xl font-keepick-primary font-medium text-[#F5E7C6] mt-0 tracking-wide">
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
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={albumToDelete?.title || ""}
        itemType="앨범"
        isLoading={isDeletingAlbum}
      />
    </div>
  );
}
