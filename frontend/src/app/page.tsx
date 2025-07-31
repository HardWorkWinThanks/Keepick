// app/page.tsx

"use client";

import { useState } from "react";
import Header from "@/components/layout/header"; // 개선된 Header 컴포넌트
import Sidebar from "@/components/layout/sidebar"; // 개선된 Sidebar 컴포넌트
import Image from "next/image";
import Link from "next/link"; // Link 컴포넌트 추가

export default function HomePage() {
  // 사이드바 상태 관리를 HomePage 내부에서 다시 처리합니다.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 실제로는 API나 인증 상태에서 가져올 데이터 예시
  const userName = "wmwogus";
  const totalPhotos = 1234;
  const totalAlbums = 12;

  const recentAlbum = {
    title: "제주도 제일 재밌었던 곳 뽑기!",
    coverImage: "/jeju-dummy2.jpg",
    type: "티어 앨범",
    url: "/albums/tier/1",
  };

  const featuredPhoto = {
    src: "/jaewan1.jpg",
    album: "싸피에서의 추억",
    url: "/albums/timeline/2",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (개선된 버전) */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {/* Header (개선된 버전) */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* === 메인 콘텐츠 섹션 === */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* 1. 상단 환영 및 비디오 섹션 */}
          <section className="flex items-center justify-between gap-12 flex-wrap mb-12 md:mb-16">
            {/* 좌측: 개인화된 대시보드 */}
            <div className="flex-1 min-w-[350px] animate-fade-slide-in">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-2">
                안녕하세요,{" "}
                <span className="text-[var(--primary-color)]">{userName}</span>
                님!
              </h1>
              <p className="text-lg text-gray-600 mt-3 max-w-lg">
                총 {totalPhotos.toLocaleString()}장의 사진과 {totalAlbums}개의
                앨범을 만들었어요.
                <br />
                오늘 어떤 추억을 정리해볼까요?
              </p>

              {/* 빠른 실행 (Quick Actions) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-lg">
                <Link
                  href="/albums/new"
                  className="p-5 bg-teal-50 rounded-xl cursor-pointer hover:bg-teal-100 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                  <h3 className="text-lg font-semibold text-teal-800">
                    ➕ 새 앨범 만들기
                  </h3>
                  <p className="text-sm text-teal-600 mt-1">
                    타임라인 또는 티어 앨범
                  </p>
                </Link>
                <Link
                  href="/photos/upload"
                  className="p-5 bg-sky-50 rounded-xl cursor-pointer hover:bg-sky-100 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                  <h3 className="text-lg font-semibold text-sky-800">
                    🖼️ 사진 업로드
                  </h3>
                  <p className="text-sm text-sky-600 mt-1">
                    그룹 갤러리에 추가하기
                  </p>
                </Link>
                <Link
                  href="/friends/invite"
                  className="p-5 bg-indigo-50 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 sm:col-span-2"
                >
                  <h3 className="text-lg font-semibold text-indigo-800">
                    👥 친구 초대하기
                  </h3>
                  <p className="text-sm text-indigo-600 mt-1">
                    함께 추억을 공유해요
                  </p>
                </Link>
              </div>
            </div>

            {/* 우측: 기존 비디오 (유지) */}
            <div className="flex-[1.2] flex justify-center items-center min-w-[350px] animate-float">
              <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto filter brightness-105"
                  poster="/placeholder.svg?height=400&width=600&text=Keepick+Demo+Video"
                >
                  <source src="/main-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </section>

          {/* 2. 추가 콘텐츠 섹션 (스크롤 후) */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* 이어서 작업하기 (최근 활동) */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  이어서 작업하기
                </h2>
                <Link
                  href={recentAlbum.url}
                  className="flex items-center space-x-4 group"
                >
                  <Image
                    src={recentAlbum.coverImage}
                    alt={recentAlbum.title}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div>
                    <p className="text-sm text-gray-500">{recentAlbum.type}</p>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-[var(--primary-color)] transition-colors">
                      {recentAlbum.title}
                    </h3>
                    <div className="text-[var(--primary-color)] font-semibold mt-1">
                      바로가기 →
                    </div>
                  </div>
                </Link>
              </div>

              {/* 오늘의 추억 (하이라이트) */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  오늘의 추억
                </h2>
                <Link
                  href={featuredPhoto.url}
                  className="relative cursor-pointer group block"
                >
                  <Image
                    src={featuredPhoto.src}
                    alt="추천 사진"
                    width={600}
                    height={200}
                    className="w-full h-40 rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all rounded-lg" />
                  <p className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
                    {featuredPhoto.album} 앨범에서
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
