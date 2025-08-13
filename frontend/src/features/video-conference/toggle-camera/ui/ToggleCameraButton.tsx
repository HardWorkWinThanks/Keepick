// src/features/video-conference/toggle-camera/ui/ToggleCameraButton.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleCamera } from "@/entities/video-conference/media/model/slice";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/solid";

export const ToggleCameraButton = () => {
  const dispatch = useAppDispatch();
  const isCameraOn = useAppSelector((state) => state.media.isCameraOn);

  const handleToggle = () => {
    dispatch(toggleCamera());
  };

  // Redux 상태가 변경되면 실제 미디어 트랙의 상태를 변경합니다.
  useEffect(() => {
    mediasoupManager.toggleTrack("video", isCameraOn);
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
        <VideoCameraSlashIcon className="h-6 w-6 text-white" />
      )}
    </button>
  );
};
