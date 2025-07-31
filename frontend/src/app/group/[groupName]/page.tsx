// app/group/[groupName]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import GroupSidebar from "@/components/layout/GroupSidebar";
import TierAlbumView from "@/components/group/TierAlbumView";
import TimelineAlbumView from "@/components/group/TimelineAlbumView";
import HighlightAlbumView from "@/components/group/HighlightAlbumView";
import { PlusIcon, PhotoIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

type AlbumType = "timeline" | "tier" | "highlight";

// 페이지 컴포넌트
export default function GroupPage({
  params: { groupName: encodedGroupName },
}: {
  params: { groupName: string };
}) {
  const groupName = decodeURIComponent(encodedGroupName);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<AlbumType>("tier");
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string;
    title: string;
    type: AlbumType;
  } | null>(null);

  useEffect(() => {
    if (selectedAlbum) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [selectedAlbum]);

  const handleSelectAlbum = (id: string, title: string, type: AlbumType) => {
    setSelectedAlbum({ id, title, type });
  };

  const handleBackToList = () => {
    setSelectedAlbum(null);
  };

  // 1. 타임라인 앨범 목록 렌더링
  const renderTimelineAlbumList = () => {
    const albums = [
      {
        id: "airport-trip",
        title: "김포공항에서 출발",
        date: "2025.06.25",
        coverImage: "/airport-dummy1.jpg",
      },
      {
        id: "jeju-travel",
        title: "제주도 여행",
        date: "2025.07.10",
        coverImage: "/jeju-dummy1.webp",
      },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">타임라인 앨범</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-semibold">
            <PlusIcon className="w-5 h-5" /> 새 앨범
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() =>
                handleSelectAlbum(album.id, album.title, "timeline")
              }
              className="bg-white rounded-xl shadow-md border overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="relative h-48">
                <Image
                  src={album.coverImage}
                  alt={album.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h4 className="text-lg font-bold truncate">{album.title}</h4>
                <p className="text-sm text-gray-500">{album.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 2. 티어 앨범 목록 렌더링
  const renderTierAlbumList = () => {
    const tierAlbums = [
      {
        id: "best-moments",
        title: "제주도 제일 재밌었던 곳 뽑기!",
        coverImage: "/jeju-dummy2.jpg",
        date: "2025.07.25",
      },
      {
        id: "travel-memories",
        title: "싸피에서의 추억",
        coverImage: "/jaewan1.jpg",
        date: "2025.06.10",
      },
      {
        id: "family-gathering",
        title: "도쿄여행에서 먹은 음식",
        coverImage: "/food-dummy1.jpg",
        date: "2025.08.15",
      },
    ];
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">티어 앨범 목록</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors">
            <PlusIcon className="w-5 h-5" /> 새 티어 앨범
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {tierAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => handleSelectAlbum(album.id, album.title, "tier")}
              className="bg-white rounded-xl shadow-md border overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="relative h-48">
                <Image
                  src={album.coverImage}
                  alt={album.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h4 className="absolute bottom-4 left-4 text-white text-xl font-bold">
                  {album.title}
                </h4>
              </div>
              <p className="p-4 text-sm text-gray-500">{album.date}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. 하이라이트 앨범 목록 렌더링
  const renderHighlightAlbumList = () => {
    const highlightAlbums = [
      { id: "highlight-1", title: "하이라이트 1" },
      { id: "highlight-2", title: "하이라이트 2" },
      { id: "highlight-3", title: "하이라이트 3" },
      { id: "highlight-4", title: "하이라이트 4" },
    ];
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-7">
        {highlightAlbums.map((album) => (
          <div
            key={album.id}
            onClick={() =>
              handleSelectAlbum(album.id, album.title, "highlight")
            }
            className="bg-white rounded-2xl overflow-hidden shadow-xl cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl aspect-video relative flex items-center justify-center"
          >
            <h3 className="text-2xl font-bold text-gray-800">{album.title}</h3>
          </div>
        ))}
      </div>
    );
  };

  const renderActiveAlbumView = () => {
    if (!selectedAlbum) return null;

    switch (selectedAlbum.type) {
      case "tier":
        return (
          <TierAlbumView
            albumId={selectedAlbum.id}
            albumTitle={selectedAlbum.title}
            onBack={handleBackToList}
          />
        );
      case "timeline":
        return <TimelineAlbumView albumId={selectedAlbum.id} />;
      case "highlight":
        return <HighlightAlbumView albumId={selectedAlbum.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GroupSidebar
        groupName={groupName}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-6 sm:p-8">
          {selectedAlbum ? (
            renderActiveAlbumView()
          ) : (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {groupName} 그룹스페이스
                </h1>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200 mb-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`px-4 py-3 font-semibold ${
                      activeTab === "timeline"
                        ? "border-b-2 border-teal-500 text-teal-600"
                        : "text-gray-500"
                    }`}
                  >
                    📅 타임라인
                  </button>
                  <button
                    onClick={() => setActiveTab("tier")}
                    className={`px-4 py-3 font-semibold ${
                      activeTab === "tier"
                        ? "border-b-2 border-teal-500 text-teal-600"
                        : "text-gray-500"
                    }`}
                  >
                    🏆 티어
                  </button>
                  <button
                    onClick={() => setActiveTab("highlight")}
                    className={`px-4 py-3 font-semibold ${
                      activeTab === "highlight"
                        ? "border-b-2 border-teal-500 text-teal-600"
                        : "text-gray-500"
                    }`}
                  >
                    ✨ 하이라이트
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg font-semibold text-gray-700">
                  <PhotoIcon className="w-5 h-5" /> 갤러리
                </button>
              </div>

              <div>
                {activeTab === "timeline" && renderTimelineAlbumList()}
                {activeTab === "tier" && renderTierAlbumList()}
                {activeTab === "highlight" && renderHighlightAlbumList()}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
