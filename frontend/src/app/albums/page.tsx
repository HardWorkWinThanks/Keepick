"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";

type AlbumType = "timeline" | "tier" | "highlight";

export default function AlbumsPage() {
  const [activeTab, setActiveTab] = useState<AlbumType>("timeline");
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedTierAlbum, setSelectedTierAlbum] = useState<string | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleBackClick = () => {
    router.push("/");
  };
  {
    /******************************************************************** */
  }
  // 드래그 앤 드롭 상태 관리
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  // 정밀 티어 모드 상태
  const [precisionTierMode, setPrecisionTierMode] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    newPhoto: { id: string; src: string; name: string };
    existingPhoto: { id: string; src: string; name: string };
    targetTier: string;
    currentStep: number;
    totalSteps: number;
    sourceType: string;
  } | null>(null);

  // 사진 데이터
  const [availablePhotos, setAvailablePhotos] = useState([
    {
      id: "photo1",
      src: "/placeholder.svg?height=100&width=100&text=사진1",
      name: "사진1",
    },
    {
      id: "photo2",
      src: "/placeholder.svg?height=100&width=100&text=사진2",
      name: "사진2",
    },
    {
      id: "photo3",
      src: "/placeholder.svg?height=100&width=100&text=사진3",
      name: "사진3",
    },
    {
      id: "photo4",
      src: "/placeholder.svg?height=100&width=100&text=사진4",
      name: "사진4",
    },
    {
      id: "photo5",
      src: "/placeholder.svg?height=100&width=100&text=사진5",
      name: "사진5",
    },
    {
      id: "photo6",
      src: "/placeholder.svg?height=100&width=100&text=사진6",
      name: "사진6",
    },
    {
      id: "photo7",
      src: "/placeholder.svg?height=100&width=100&text=사진7",
      name: "사진7",
    },
    {
      id: "photo8",
      src: "/placeholder.svg?height=100&width=100&text=사진8",
      name: "사진8",
    },
    {
      id: "photo9",
      src: "/placeholder.svg?height=100&width=100&text=사진9",
      name: "사진9",
    },
  ]);
  // 티어별 사진 배치 상태
  const [tierPhotos, setTierPhotos] = useState<{ [key: string]: { id: string; src: string; name: string }[] }>({
    S: [
      {
        id: "photo_s1",
        src: "/placeholder.svg?height=100&width=100&text=S급1",
        name: "S급 사진1",
      },
      {
        id: "photo_s2",
        src: "/placeholder.svg?height=100&width=100&text=S급2",
        name: "S급 사진2",
      },
    ],
    A: [],
    B: [],
    C: [],
    D: [],
  });
  {
    /******************************************************* */
  }

  const renderTimelineAlbum = () => {
    // 앨범이 선택되지 않았으면 앨범 목록을 보여줌
    if (!selectedAlbum) {
      const albums = [
        {
          id: "airport-trip",
          title: "김포공항에서 출발",
          date: "2025.06.25",
          photoCount: 12,
          coverImage:
            "/placeholder.svg?height=300&width=400&text=김포공항+출발",
          gradient: "from-[#E0F2F1] to-[var(--primary-color)]",
        },
        {
          id: "jeju-travel",
          title: "제주도 여행",
          date: "2025.07.10",
          photoCount: 8,
          coverImage: "/placeholder.svg?height=300&width=400&text=제주도+여행",
          gradient: "from-[#F3E5F5] to-[#AA00FF]",
        },
        {
          id: "busan-trip",
          title: "부산 바다 여행",
          date: "2025.08.15",
          photoCount: 15,
          coverImage: "/placeholder.svg?height=300&width=400&text=부산+바다",
          gradient: "from-[#E3F2FD] to-[#2196F3]",
        },
        {
          id: "seoul-tour",
          title: "서울 시내 투어",
          date: "2025.09.20",
          photoCount: 20,
          coverImage: "/placeholder.svg?height=300&width=400&text=서울+투어",
          gradient: "from-[#FFF3E0] to-[#FF9800]",
        },
        {
          id: "mountain-hiking",
          title: "설악산 등반",
          date: "2025.10.05",
          photoCount: 25,
          coverImage: "/placeholder.svg?height=300&width=400&text=설악산+등반",
          gradient: "from-[#E8F5E8] to-[#4CAF50]",
        },
        {
          id: "autumn-festival",
          title: "가을 축제",
          date: "2025.10.25",
          photoCount: 18,
          coverImage: "/placeholder.svg?height=300&width=400&text=가을+축제",
          gradient: "from-[#FFF8E1] to-[#FFC107]",
        },
      ];

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-montserrat text-2xl font-bold text-[var(--text-dark)]">
              타임라인 앨범 목록
            </h3>
            <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2">
              <span>➕</span>새 앨범 만들기
            </button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album.id)}
                className="bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group"
              >
                <div
                  className={`w-full h-48 bg-gradient-to-r ${album.gradient} relative overflow-hidden`}
                >
                  <img
                    src={album.coverImage || "/placeholder.svg"}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    📷 {album.photoCount}장
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-montserrat text-xl font-bold text-[var(--text-dark)] group-hover:text-[var(--primary-color)] transition-colors">
                      {album.title}
                    </h4>
                    <span className="text-sm text-gray-500 font-semibold">
                      {album.date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">📅</span>
                      <span className="text-sm">타임라인 앨범</span>
                    </div>
                    <div className="text-[var(--primary-color)] font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      보기 →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 앨범이 선택되었으면 해당 앨범의 상세 내용을 보여줌
    const albumDetails = {
      "airport-trip": {
        title: "김포공항에서 출발",
        date: "2025.06.25",
        gradient: "from-[#E0F2F1] to-[var(--primary-color)]",
        coverImage: "/placeholder.svg?height=250&width=1200&text=대표+사진",
      },
      "jeju-travel": {
        title: "제주도 여행",
        date: "2025.07.10",
        gradient: "from-[#F3E5F5] to-[#AA00FF]",
        coverImage: "/placeholder.svg?height=250&width=1200&text=두번째+모임",
      },
    };

    const currentAlbum =
      albumDetails[selectedAlbum as keyof typeof albumDetails] ||
      albumDetails["airport-trip"];

    return (
      <div className="space-y-6">
        {/* 뒤로가기 버튼 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 text-[var(--primary-color)] hover:text-[#2fa692] transition-colors font-semibold"
          >
            <span className="text-xl">←</span>
            앨범 목록으로 돌아가기
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div
            className={`w-full h-64 bg-gradient-to-r ${currentAlbum.gradient} rounded-2xl mb-6 flex items-center justify-center text-[var(--primary-color)] text-xl font-semibold relative overflow-hidden`}
          >
            <img
              src={currentAlbum.coverImage || "/placeholder.svg"}
              alt="대표 사진"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-montserrat text-2xl font-bold text-[var(--text-dark)]">
              {currentAlbum.title}
            </h3>
            <span className="text-lg text-gray-600 font-semibold">
              {currentAlbum.date}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-[var(--card-bg)] rounded-2xl h-44 flex flex-col items-center justify-center text-center relative cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-400 text-3xl mb-2">
                  <span className="text-2xl">📷</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-black/20 text-white p-2 rounded-b-2xl font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  사진 추가
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTierAlbum = () => {
    // 티어 앨범이 선택되지 않았으면 티어 앨범 목록을 보여줌
    if (!selectedTierAlbum) {
      const tierAlbums = [
        {
          id: "best-moments",
          title: "최고의 순간들",
          date: "2025.06.25",
          totalPhotos: 45,
          tierDistribution: { S: 8, A: 12, B: 15, C: 10 },
          coverImage:
            "/placeholder.svg?height=300&width=400&text=최고의+순간들",
          gradient: "from-[#FFD700] to-[#FFA500]",
        },
        {
          id: "travel-memories",
          title: "여행 추억 모음",
          date: "2025.07.10",
          totalPhotos: 32,
          tierDistribution: { S: 5, A: 8, B: 12, C: 7 },
          coverImage: "/placeholder.svg?height=300&width=400&text=여행+추억",
          gradient: "from-[#87CEEB] to-[#4682B4]",
        },
        {
          id: "family-gathering",
          title: "가족 모임",
          date: "2025.08.15",
          totalPhotos: 28,
          tierDistribution: { S: 6, A: 9, B: 8, C: 5 },
          coverImage: "/placeholder.svg?height=300&width=400&text=가족+모임",
          gradient: "from-[#FFB6C1] to-[#FF69B4]",
        },
        {
          id: "work-events",
          title: "회사 행사",
          date: "2025.09.20",
          totalPhotos: 38,
          tierDistribution: { S: 4, A: 10, B: 14, C: 10 },
          coverImage: "/placeholder.svg?height=300&width=400&text=회사+행사",
          gradient: "from-[#98FB98] to-[#32CD32]",
        },
        {
          id: "hobby-activities",
          title: "취미 활동",
          date: "2025.10.05",
          totalPhotos: 22,
          tierDistribution: { S: 3, A: 6, B: 8, C: 5 },
          coverImage: "/placeholder.svg?height=300&width=400&text=취미+활동",
          gradient: "from-[#DDA0DD] to-[#9370DB]",
        },
        {
          id: "special-events",
          title: "특별한 이벤트",
          date: "2025.10.25",
          totalPhotos: 35,
          tierDistribution: { S: 7, A: 11, B: 10, C: 7 },
          coverImage:
            "/placeholder.svg?height=300&width=400&text=특별한+이벤트",
          gradient: "from-[#F0E68C] to-[#DAA520]",
        },
      ];

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-montserrat text-2xl font-bold text-[var(--text-dark)]">
              티어 앨범 목록
            </h3>
            <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2">
              <span>➕</span>새 티어 앨범 만들기
            </button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
            {tierAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedTierAlbum(album.id)}
                className="bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group"
              >
                <div
                  className={`w-full h-48 bg-gradient-to-r ${album.gradient} relative overflow-hidden`}
                >
                  <img
                    src={album.coverImage || "/placeholder.svg"}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    🏆 {album.totalPhotos}장
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-montserrat text-xl font-bold text-[var(--text-dark)] group-hover:text-[var(--primary-color)] transition-colors">
                      {album.title}
                    </h4>
                    <span className="text-sm text-gray-500 font-semibold">
                      {album.date}
                    </span>
                  </div>

                  {/* 티어 분포 표시 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                      <span>S: {album.tierDistribution.S}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"></div>
                      <span>A: {album.tierDistribution.A}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-700 rounded-full"></div>
                      <span>B: {album.tierDistribution.B}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-700 rounded-full"></div>
                      <span>C: {album.tierDistribution.C}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">🏆</span>
                      <span className="text-sm">티어 앨범</span>
                    </div>
                    <div className="text-[var(--primary-color)] font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      보기 →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 티어 앨범이 선택되었으면 해당 앨범의 상세 내용을 보여줌
    const tierAlbumDetails = {
      "best-moments": {
        title: "최고의 순간들",
        date: "2025.06.25",
      },
      "travel-memories": {
        title: "여행 추억 모음",
        date: "2025.07.10",
      },
    };

    const currentTierAlbum =
      tierAlbumDetails[selectedTierAlbum as keyof typeof tierAlbumDetails] ||
      tierAlbumDetails["best-moments"];

    const tiers = [
      { label: "S", color: "from-yellow-400 to-orange-500", items: 3 },
      { label: "A", color: "from-blue-500 to-blue-700", items: 0 },
      { label: "B", color: "from-green-500 to-green-700", items: 0 },
      { label: "C", color: "from-red-500 to-red-700", items: 0 },
    ];

    return (
      <div className="space-y-6">
        {/* 뒤로가기 버튼 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedTierAlbum(null)}
            className="flex items-center gap-2 text-[var(--primary-color)] hover:text-[#2fa692] transition-colors font-semibold"
          >
            <span className="text-xl">←</span>
            티어 앨범 목록으로 돌아가기
          </button>
        </div>

        {/* 앨범 제목 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-montserrat text-2xl font-bold text-[var(--text-dark)]">
                {currentTierAlbum.title}
              </h3>
              <p className="text-gray-600">{currentTierAlbum.date}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl">🏆</div>

              {/* 정밀 티어 모드 토글 버튼 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  정밀 티어 모드
                </span>
                <button
                  onClick={() => setPrecisionTierMode(!precisionTierMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 ${
                    precisionTierMode
                      ? "bg-[var(--primary-color)]"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      precisionTierMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  {!precisionTierMode && (
                    <span className="absolute left-1.5 top-1 text-gray-500 text-xs font-bold">
                      ✕
                    </span>
                  )}
                </button>
              </div>

              <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2">
                💾 저장하기
              </button>
            </div>
          </div>
        </div>

        {/**************************************************************************************** */}
        {/* 티어 시스템 */}
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.label}
              className="bg-white rounded-3xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${tier.color} text-white rounded-full flex items-center justify-center font-montserrat text-2xl font-bold shadow-lg flex-shrink-0`}
                >
                  {tier.label}
                </div>
                <div className="flex-1">
                  <div
                    className={`min-h-32 border-2 border-dashed rounded-2xl p-4 flex flex-wrap gap-3 items-start transition-all ${
                      dragOverTier === tier.label
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10"
                        : "border-[var(--border-color)] hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)]/5"
                    }`}
                    onDragOver={(e) => handleDragOver(e, tier.label)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, tier.label)}
                  >
                    {tierPhotos[tier.label]?.length > 0 ? (
                      tierPhotos[tier.label].map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group cursor-move"
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, photo.id, tier.label)
                          }
                        >
                          <div className="w-24 h-24 bg-[var(--card-bg)] rounded-xl shadow-md hover:-translate-y-1 hover:shadow-lg transition-all overflow-hidden">
                            <img
                              src={photo.src || "/placeholder.svg"}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleReturnToAvailable(photo.id, tier.label)
                            }
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center py-8">
                        <span className="text-3xl mb-2">📷</span>
                        <span className="text-sm">
                          이미지를 여기로 드래그 하세요
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 사진 선택 영역 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h4 className="font-montserrat text-xl font-bold text-[var(--text-dark)] mb-4">
            사진 선택
          </h4>
          <div className="flex flex-wrap gap-3">
            {availablePhotos.map((photo) => (
              <div
                key={photo.id}
                className="w-20 h-20 bg-[var(--card-bg)] rounded-xl shadow-md cursor-grab hover:-translate-y-1 hover:shadow-lg transition-all overflow-hidden"
                draggable
                onDragStart={(e) => handleDragStart(e, photo.id, "available")}
              >
                <img
                  src={photo.src || "/placeholder.svg"}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <button className="w-20 h-20 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center text-gray-400 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all">
              <span className="text-2xl">+</span>
            </button>
          </div>
        </div>

        {/****************************************************************************************/}
      </div>
    );
  };

  const renderHighlightAlbum = () => (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-7">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl overflow-hidden shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl relative pb-[75%]"
        >
          <div className="absolute inset-0 bg-[var(--card-bg)] flex flex-col items-center justify-center">
            <h3 className="font-montserrat text-2xl font-bold text-[var(--text-dark)] mb-4 text-center">
              하이라이트 앨범 {i}
            </h3>
            <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center transition-all hover:bg-black/50 hover:scale-105">
              <span className="text-white text-4xl">▶️</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  {
    /****************************************************************************************/
  }

  // 드래그 시작
  const handleDragStart = (
    e: React.DragEvent,
    photoId: string,
    source: "available" | string
  ) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ photoId, source }));
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, tier: string) => {
    e.preventDefault();
    setDragOverTier(tier);
  };

  // 드래그 리브
  const handleDragLeave = () => {
    setDragOverTier(null);
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, targetTier: string) => {
    e.preventDefault();
    setDragOverTier(null);

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { photoId, source } = data;

    // 드래그된 사진 찾기
    let draggedPhotoData = null;
    if (source === "available") {
      draggedPhotoData = availablePhotos.find((p) => p.id === photoId);
    } else {
      draggedPhotoData = tierPhotos[source]?.find((p) => p.id === photoId);
    }

    if (!draggedPhotoData) {
      return;
    }

    // 정밀 티어 모드가 켜져있고 대상 티어에 이미 사진이 있으면 비교 모달 표시
    if (precisionTierMode && tierPhotos[targetTier]?.length > 0) {
      const existingPhoto = tierPhotos[targetTier][0]; // 첫 번째 사진과 비교
      setComparisonData({
        newPhoto: draggedPhotoData,
        existingPhoto: existingPhoto,
        targetTier: targetTier,
        currentStep: 1,
        totalSteps: 3,
        sourceType: source,
      });
      setShowComparisonModal(true);
      return;
    }

    // 일반 모드이거나 티어가 비어있으면 바로 이동
    if (source === "available") {
      setAvailablePhotos((prev) => prev.filter((p) => p.id !== photoId));
      setTierPhotos((prev) => ({
        ...prev,
        [targetTier]: [...prev[targetTier], draggedPhotoData],
      }));
    } else if (source !== targetTier) {
      setTierPhotos((prev) => ({
        ...prev,
        [source]: prev[source].filter((p) => p.id !== photoId),
        [targetTier]: [...prev[targetTier], draggedPhotoData],
      }));
    }
  };

  // 비교 선택 처리
  const handleComparisonChoice = (choice: "existing" | "new" | "skip") => {
    if (!comparisonData) return;

    const { newPhoto, sourceType } = comparisonData;

    if (choice === "new" || choice === "skip") {
      // 새로운 사진을 선택하거나 건너뛰기 - 사진을 대상 티어로 이동
      if (sourceType === "available") {
        setAvailablePhotos((prev) => prev.filter((p) => p.id !== newPhoto.id));
      } else {
        setTierPhotos((prev) => ({
          ...prev,
          [sourceType]: prev[sourceType].filter((p) => p.id !== newPhoto.id),
        }));
      }

      setTierPhotos((prev) => ({
        ...prev,
        [comparisonData.targetTier]: [
          ...prev[comparisonData.targetTier],
          newPhoto,
        ],
      }));
    }
    // 'existing'을 선택한 경우는 아무것도 하지 않음 (기존 상태 유지)

    setShowComparisonModal(false);
    setComparisonData(null);
  };

  // 사진을 사용 가능한 목록으로 되돌리기
  const handleReturnToAvailable = (photoId: string, fromTier: string) => {
    const photo = tierPhotos[fromTier]?.find((p) => p.id === photoId);
    if (photo) {
      setTierPhotos((prev) => ({
        ...prev,
        [fromTier]: prev[fromTier].filter((p) => p.id !== photoId),
      }));
      setAvailablePhotos((prev) => [...prev, photo]);
    }
  };
  {
    /****************************************************************************************/
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex relative">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar activeGroup="family" />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-8 left-4 z-30 bg-[var(--primary-color)] text-white p-3 rounded-xl shadow-lg hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span className="text-lg">{sidebarOpen ? "✕" : "☰"}</span>
        </button>

        <main className="flex-1 p-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="text-2xl text-[var(--text-dark)] hover:text-[var(--primary-color)] transition-colors cursor-pointer"
            >
              <span>←</span>
            </button>
            <div>
              <h1 className="font-montserrat text-3xl font-bold text-[var(--text-dark)]">
                그룹스페이스 - D207
              </h1>
              <p className="text-base text-gray-600">
                그룹원들과 소중한 추억을 관리하세요
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                W
              </div>
              <span className="font-semibold text-[var(--text-dark)]">
                wmwogus
              </span>
              <span className="text-sm text-gray-500">▼</span>
            </div>
            <button className="text-2xl text-[var(--text-dark)]">
              <span>☰</span>
            </button>
          </div>
        </div>

        <div className="flex bg-white rounded-2xl p-2 shadow-lg mb-8 justify-around items-center sticky top-8 z-20">
          {[
            { type: "timeline", icon: "📅", label: "타임라인 앨범" },
            { type: "tier", icon: "🏆", label: "티어 앨범" },
            { type: "highlight", icon: "✨", label: "하이라이트 앨범" },
          ].map((tab) => (
            <button
              key={tab.type}
              onClick={() => {
                setActiveTab(tab.type as AlbumType);
                // 탭 변경시 선택된 앨범 초기화
                if (tab.type === "timeline") setSelectedAlbum(null);
                if (tab.type === "tier") setSelectedTierAlbum(null);
              }}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === tab.type
                  ? "bg-gradient-to-r from-[var(--primary-color)] to-[#28a795] text-white shadow-lg -translate-y-0.5"
                  : "text-gray-600 hover:bg-[var(--primary-color)]/10"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === "timeline" && renderTimelineAlbum()}
          {activeTab === "tier" && renderTierAlbum()}
          {activeTab === "highlight" && renderHighlightAlbum()}
        </div>
      </main>

      {/* 그룹챗 위젯 */}
      <button
        onClick={() => router.push("/chat")}
        className="fixed bottom-6 right-6 bg-[var(--primary-color)] text-white p-4 rounded-full shadow-2xl hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl z-50 group"
      >
        <div className="relative">
          <span className="text-2xl">💬</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-full right-0 mb-2 bg-black/80 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          그룹챗 참여하기
        </div>
      </button>

      {/********************************************************************** */}
      {/* 정밀 티어 모드 비교 모달 */}
      {showComparisonModal && comparisonData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-2">
                어떤 추억이 더 소중한가요?
              </h2>
              <p className="text-gray-600">
                {comparisonData.targetTier}티어 {comparisonData.currentStep}/
                {comparisonData.totalSteps}
              </p>
              <div className="text-sm text-gray-500 mt-2">
                더 높은 순위에 두고 싶은 추억을 선택해주세요!
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* 기존 추억 */}
              <div className="text-center">
                <div
                  className="w-full aspect-square bg-gray-100 rounded-2xl border-2 border-gray-300 mb-4 overflow-hidden cursor-pointer hover:border-[var(--primary-color)] transition-colors"
                  onClick={() => handleComparisonChoice("existing")}
                >
                  <img
                    src={
                      comparisonData.existingPhoto?.src ||
                      "/placeholder.svg?height=200&width=200&text=기존+추억"
                    }
                    alt="기존 추억"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg text-[var(--text-dark)]">
                  기존 추억
                </h3>
              </div>

              {/* 새로운 추억 */}
              <div className="text-center">
                <div
                  className="w-full aspect-square bg-gray-100 rounded-2xl border-2 border-green-500 mb-4 overflow-hidden cursor-pointer hover:border-green-600 transition-colors"
                  onClick={() => handleComparisonChoice("new")}
                >
                  <img
                    src={
                      comparisonData.newPhoto?.src ||
                      "/placeholder.svg?height=200&width=200&text=새로운+추억"
                    }
                    alt="새로운 추억"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg text-[var(--text-dark)]">
                  새로운 추억
                </h3>
              </div>
            </div>

            {/* 결과 영역 */}
            <div className="text-center mb-6">
              <h4 className="font-semibold text-lg text-[var(--text-dark)] mb-4">
                결과
              </h4>
              <div className="flex justify-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl">→</span>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-xl border-2 border-green-500 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleComparisonChoice("skip")}
                className="flex-1 px-6 py-3 bg-[var(--primary-color)] text-white rounded-xl font-semibold hover:bg-[#2fa692] transition-colors"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
