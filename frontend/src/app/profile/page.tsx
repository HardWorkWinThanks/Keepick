"use client";

import { AppLayout } from "@/widgets/layout";
import { ProfileForm } from "@/features/profile";

export default function ProfilePage() {
  return (
    <AppLayout 
      backgroundColor="#f9fafb"
      sidebarConfig={{ 
        showCreateGroupButton: false,
        showGroupsSection: true,
        showFriendsSection: true
      }}
    >
      <main className="p-4 sm:p-6 lg:p-8">
        <ProfileForm />
      </main>
    </AppLayout>
  );
}
