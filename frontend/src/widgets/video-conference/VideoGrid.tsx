// src/widgets/video-conference/VideoGrid.tsx
"use client";

import { useAppSelector } from "@/shared/hooks/redux";
import { UserVideoCard } from "@/entities/video-conference/user/ui/UserVideoCard";
import { ScreenShareCard } from "@/entities/video-conference/screen-share/ui/ScreenShareCard";
import {
  useAllRemotePeers,
  useLocalMediaTrack,
  useAllScreenShareTracks,
} from "@/shared/hooks/useMediaTrack";
import { useState, useMemo, useEffect } from "react";

export const VideoGrid = () => {
  const localUserName = useAppSelector((state) => state.session.userName);
  const remotePeers = useAllRemotePeers();
  const localVideo = useLocalMediaTrack("video");
  const localAudio = useLocalMediaTrack("audio");
  const { localScreenShare, remoteScreenShares, hasAnyScreenShare } = useAllScreenShareTracks();
  const [spotlightVideo, setSpotlightVideo] = useState<{
    type: "screen-share" | "video";
    id: string;
    userName: string;
    isLocal: boolean;
    socketId?: string;
    priority: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // 페이지당 표시할 항목 수 (6개)
  const ITEMS_PER_PAGE = 6;

  // 로컬 미디어 트랙이 하나라도 있으면 표시
  const hasLocalMedia = localVideo.track || localAudio.track;

  // 동적 그리드 항목 관리 (LazyGrid 스타일)
  const gridItems = useMemo(() => {
    const items = [];

    // 화면 공유들 (최우선)
    if (
      localScreenShare.hasScreenTrack &&
      localScreenShare.track &&
      localScreenShare.track.readyState === "live"
    ) {
      items.push({
        id: "local-screen-share",
        type: "screen-share" as const,
        userName: `${localUserName || "나"}의 화면 공유`,
        isLocal: true,
        priority: 1,
      });
    }

    remoteScreenShares
      .filter((share) => share.screenTrack?.track && share.screenTrack.track.readyState === "live")
      .forEach((share) => {
        items.push({
          id: `remote-screen-share-${share.socketId}`,
          type: "screen-share" as const,
          userName: `${share.peerName}의 화면 공유`,
          isLocal: false,
          socketId: share.socketId,
          priority: 2,
        });
      });

    // 비디오들 (화면 공유 다음)
    if (hasLocalMedia) {
      items.push({
        id: "local",
        type: "video" as const,
        userName: `${localUserName || "나"} (나)`,
        isLocal: true,
        priority: 3,
      });
    }

    remotePeers.forEach((peer) => {
      items.push({
        id: peer.socketId,
        type: "video" as const,
        userName: peer.peerName,
        isLocal: false,
        socketId: peer.socketId,
        priority: 4,
      });
    });

    // 우선순위와 ID로 정렬 (안정적인 순서)
    return items.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  }, [localScreenShare, remoteScreenShares, hasLocalMedia, localUserName, remotePeers]);

  // 페이지네이션 계산
  const paginationInfo = useMemo(() => {
    const totalItems = gridItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const validCurrentPage = Math.min(currentPage, totalPages - 1);
    const startIndex = validCurrentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const currentPageItems = gridItems.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentPage: validCurrentPage,
      startIndex,
      endIndex,
      currentPageItems,
      hasNextPage: validCurrentPage < totalPages - 1,
      hasPrevPage: validCurrentPage > 0,
    };
  }, [gridItems, currentPage, ITEMS_PER_PAGE]);

  // 현재 페이지의 그리드 레이아웃 계산
  const gridLayout = useMemo(() => {
    const itemsCount = paginationInfo.currentPageItems.length;

    if (itemsCount === 0) return "grid-cols-1";
    if (itemsCount === 1) return "grid-cols-1 place-items-center";
    if (itemsCount === 2) return "grid-cols-2 place-items-center"; // 2명일 때 중앙정렬
    if (itemsCount <= 4) return "grid-cols-2";
    if (itemsCount <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-3";
  }, [paginationInfo.currentPageItems.length]);

  // 아이템 크기 제한 계산
  const itemSizing = useMemo(() => {
    const itemsCount = paginationInfo.currentPageItems.length;

    if (itemsCount === 1) {
      return "max-w-2xl max-h-2xl aspect-video mx-auto";
    }
    if (itemsCount === 2) {
      return "max-w-lg max-h-lg aspect-video w-full h-full"; // 2명일 때 크기 제한
    }
    return "w-full h-full min-h-[200px]";
  }, [paginationInfo.currentPageItems.length]);

  // 페이지 변경 핸들러
  const handleNextPage = () => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (paginationInfo.hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // 현재 페이지가 유효하지 않으면 자동으로 조정
  useEffect(() => {
    if (currentPage >= paginationInfo.totalPages && paginationInfo.totalPages > 0) {
      setCurrentPage(paginationInfo.totalPages - 1);
    }
  }, [currentPage, paginationInfo.totalPages]);

  // 스포트라이트된 화면 공유가 끝났을 때 자동으로 그리드 뷰로 돌아가기
  useEffect(() => {
    if (spotlightVideo && spotlightVideo.type === "screen-share") {
      // 현재 스포트라이트된 항목이 그리드 아이템 목록에 있는지 확인
      const currentSpotlightExists = gridItems.some(item => item.id === spotlightVideo.id);
      
      if (!currentSpotlightExists) {
        console.log(`🔄 [VideoGrid] Spotlight item ${spotlightVideo.id} no longer exists, returning to grid view`);
        setSpotlightVideo(null);
      }
    }
  }, [gridItems, spotlightVideo]);

  // ESC 키로 모드 전환
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (spotlightVideo) {
          setSpotlightVideo(null);
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isFullscreen, spotlightVideo]);

  // 스포트라이트/전체화면 전환 핸들러
  const handleVideoClick = (item: (typeof gridItems)[0]) => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else if (spotlightVideo?.id === item.id) {
      // 이미 스포트라이트된 항목 클릭 시 전체화면
      setIsFullscreen(true);
    } else {
      // 다른 항목 클릭 시 스포트라이트
      setSpotlightVideo(item);
    }
  };

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // 화면 공유가 있을 때의 레이아웃 - 화면 공유와 비디오를 함께 표시
  const getGridClassWithScreenShare = (videoCount: number, screenShareCount: number) => {
    if (screenShareCount > 0) {
      // 화면 공유 + 비디오들을 모두 표시하는 레이아웃
      const totalItems = videoCount + screenShareCount;
      if (totalItems <= 2) return "grid-cols-1 md:grid-cols-2";
      if (totalItems <= 4) return "grid-cols-2 md:grid-cols-3";
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    }
    return getGridClass(videoCount);
  };

  const totalStreams = remotePeers.length + (hasLocalMedia ? 1 : 0);

  // 활성 화면 공유만 카운트 (끝난 트랙 제외)
  const activeLocalScreenShares =
    localScreenShare.hasScreenTrack &&
    localScreenShare.track &&
    localScreenShare.track.readyState === "live"
      ? 1
      : 0;

  const activeRemoteScreenShares = remoteScreenShares.filter(
    (share) => share.screenTrack?.track && share.screenTrack.track.readyState === "live"
  ).length;

  const totalScreenShares = activeLocalScreenShares + activeRemoteScreenShares;

  // 디버깅 로그
  console.log(`📹 [VideoGrid] Rendering:`, {
    totalItems: gridItems.length,
    currentPage: paginationInfo.currentPage,
    totalPages: paginationInfo.totalPages,
    currentPageItems: paginationInfo.currentPageItems.length,
    spotlightId: spotlightVideo?.id,
    isFullscreen,
    gridLayout,
  });

  // 전체화면 모드
  if (isFullscreen && spotlightVideo) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        {spotlightVideo.type === "screen-share" ? (
          <ScreenShareCard
            userName={spotlightVideo.userName}
            isLocal={spotlightVideo.isLocal}
            socketId={spotlightVideo.socketId}
            onFullscreenToggle={() => {}}
          />
        ) : (
          <UserVideoCard
            socketId={spotlightVideo.socketId}
            userName={spotlightVideo.userName}
            isLocal={spotlightVideo.isLocal}
          />
        )}

        {/* 전체화면 안내 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
          ESC 키로 나가기
        </div>
      </div>
    );
  }

  // Spotlight 모드가 활성화된 경우
  if (spotlightVideo) {
    const otherParticipants = gridItems.filter((item) => item.id !== spotlightVideo.id);

    return (
      <div className="flex flex-col h-full justify-center p-4 gap-4">
        {/* Spotlight 영역 */}
        <div
          className="flex-1 relative bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer"
          onClick={() => handleVideoClick(spotlightVideo)}
        >
          {spotlightVideo.type === "screen-share" ? (
            <ScreenShareCard
              userName={spotlightVideo.userName}
              isLocal={spotlightVideo.isLocal}
              socketId={spotlightVideo.socketId}
              onFullscreenToggle={() => {}}
            />
          ) : (
            <UserVideoCard
              socketId={spotlightVideo.socketId}
              userName={spotlightVideo.userName}
              isLocal={spotlightVideo.isLocal}
            />
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSpotlightVideo(null);
            }}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10"
          >
            ✕
          </button>

          {/* 확대 안내 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded text-sm">
            클릭하여 전체화면
          </div>
        </div>

        {/* 하단 참가자들 (가로 스크롤, 더 큰 크기) */}
        {otherParticipants.length > 0 && (
          <div className="h-48 relative">
            {" "}
            {/* 높이 증가: 128px -> 192px */}
            <div
              className="flex gap-3 overflow-x-auto h-full pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {otherParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex-shrink-0 w-64 h-full cursor-pointer hover:scale-105 transition-transform rounded-lg overflow-hidden"
                  onClick={() => handleVideoClick(participant)}
                >
                  {participant.type === "screen-share" ? (
                    <ScreenShareCard
                      userName={participant.userName}
                      isLocal={participant.isLocal}
                      socketId={(participant as any).socketId || ""}
                      onFullscreenToggle={() => {}}
                    />
                  ) : (
                    <UserVideoCard
                      socketId={(participant as any).socketId || ""}
                      userName={participant.userName}
                      isLocal={participant.isLocal}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 일반 그리드 모드 (페이지네이션 포함)
  return (
    // h-full: 부모(ConferenceLayout)가 준 공간을 꽉 채운다.
    // flex flex-col: 자식(페이지네이션, 그리드)을 세로로 배치한다.
    // justify-center: 그 자식들을 통째로 "세로 중앙"에 정렬한다.
    <div className="flex flex-col h-full justify-center pb-8">
      {/* 페이지네이션 컨트롤 */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 p-2 bg-[#2a2a2a] mx-4 rounded-lg mb-2">
          <button
            onClick={handlePrevPage}
            disabled={!paginationInfo.hasPrevPage}
            className={`p-2 rounded-lg transition-colors ${
              paginationInfo.hasPrevPage
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            ◀
          </button>
          <span className="text-white text-sm">
            {paginationInfo.currentPage + 1} / {paginationInfo.totalPages} (
            {paginationInfo.totalItems}명)
          </span>
          <button
            onClick={handleNextPage}
            disabled={!paginationInfo.hasNextPage}
            className={`p-2 rounded-lg transition-colors ${
              paginationInfo.hasNextPage
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            ▶
          </button>
        </div>
      )}

      {/* 비디오 그리드 */}
      <div
        className={`grid ${gridLayout} gap-4 p-4 pb-8 ${
          paginationInfo.currentPageItems.length === 2 ? "max-w-4xl mx-auto" : ""
        }`}
      >
        {paginationInfo.currentPageItems.map((item) => (
          <div
            key={item.id}
            className={`relative cursor-pointer hover:scale-105 transition-transform ${itemSizing}`}
            onClick={() => handleVideoClick(item)}
          >
            {item.type === "screen-share" ? (
              <ScreenShareCard
                userName={item.userName}
                isLocal={item.isLocal}
                socketId={(item as any).socketId || ""}
                onFullscreenToggle={() => {}}
              />
            ) : (
              <UserVideoCard
                socketId={(item as any).socketId || ""}
                userName={item.userName}
                isLocal={item.isLocal}
              />
            )}

            {/* 타입 표시 */}
            <div
              className={`absolute top-2 ${item.isLocal ? "left-2" : "right-2"} ${
                item.type === "screen-share"
                  ? "bg-orange-500"
                  : item.isLocal
                  ? "bg-orange-500"
                  : "bg-orange-500"
              } text-white text-xs px-2 py-1 rounded`}
            >
              {item.type === "screen-share" ? "화면공유" : item.isLocal ? "Local" : "원격"}
            </div>
          </div>
        ))}

        {/* 빈 그리드일 때 메시지 */}
        {gridItems.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 text-gray-500">
            참가자를 기다리는 중...
          </div>
        )}
      </div>
    </div>
  );
};
