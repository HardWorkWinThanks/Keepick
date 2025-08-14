// src/features/video-conference/toggle-camera/ui/ToggleCameraButton.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleCamera } from "@/entities/video-conference/media/model/slice";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import {
  VideoCameraIcon,
} from "@heroicons/react/24/solid";

export const ToggleCameraButton = () => {
  const dispatch = useAppDispatch();
  const isCameraOn = useAppSelector((state) => state.media.local.tracks.video?.enabled ?? false);

  const handleToggle = () => {
    dispatch(toggleCamera());
  };

  // 새로운 구조에서는 직접 제어
  useEffect(() => {
    // mediasoupManager.toggleLocalTrack("video");
  }, [isCameraOn]);

  return (
    <button
      onClick={handleToggle}
      className={`p-3 rounded-full transition-colors ${
        isCameraOn
          ? "bg-gray-600 hover:bg-gray-500"
          : "bg-red-500 hover:bg-red-600"
      }`}
      aria-label={isCameraOn ? "카메라 끄기" : "카메라 켜기"}
    >
      {isCameraOn ? (
        <VideoCameraIcon className="h-6 w-6 text-white" />
      ) : (
        <VideoCameraIcon className="h-6 w-6 text-white opacity-50" />
      )}
    </button>
  );
};
