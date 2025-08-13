// src/widgets/video-conference/ConferenceLayout.tsx
"use client";

import { ConferenceSidebar } from "./ConferenceSidebar";
import { VideoGrid } from "./VideoGrid";
import { BottomControls } from "./BottomControls";

export const ConferenceLayout = () => {
  return (
    <div className="flex h-screen bg-gray-800">
      <main className="flex-1 flex flex-col">
        <VideoGrid />
        <BottomControls />
      </main>
      <ConferenceSidebar />
    </div>
  );
};
