"use client";

import { useState } from "react";
import Header from "@/widgets/layout/ui/HeaderWidget";
import Sidebar from "@/widgets/layout/ui/SidebarWidget";
import { ProfileForm } from "@/features/profile";
import { UserProfile } from "@/features/profile";

export default function ProfilePage() {
  const initialProfile: UserProfile = {
    profileImage: "/dummy/dummy1.jpg",
    email: "user@example.com",
    socialType: "naver",
    nickname: "사용자123",
    aiProfileImage: "/dummy/dummy2.jpg",
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* 기존 main 태그 그대로 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ProfileForm initialProfile={initialProfile} />
        </main>
      </div>
    </div>
  );
}
