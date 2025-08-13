// src/widgets/video-conference/BottomControls.tsx (보내주신 코드 그대로 사용)
"use client";

import { ToggleCameraButton } from "@/features/video-conference/toggle-camera/ui/ToggleCameraButton";
import { ToggleMicButton } from "@/features/video-conference/toggle-mic/ui/ToggleMicButton";
import { LeaveRoomButton } from "@/features/video-conference/leave-room/ui/LeaveRoomButton";

export const BottomControls = () => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-gray-900 bg-opacity-70 backdrop-blur-sm p-4 rounded-full flex justify-center items-center gap-4 mb-4">
      <ToggleMicButton />
      <ToggleCameraButton />
      <LeaveRoomButton />
    </div>
  );
};
