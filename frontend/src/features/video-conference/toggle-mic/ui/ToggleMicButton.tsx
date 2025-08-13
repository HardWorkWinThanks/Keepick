// src/features/video-conference/toggle-mic/ui/ToggleMicButton.tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleMicThunk } from "@/entities/video-conference/toggle-mic/model/thunks";
import { Button } from "@/shared/ui/shadcn/button";

export const ToggleMicButton = () => {
  const dispatch = useAppDispatch();
  const { isMicOn } = useAppSelector((state) => state.media);

  const handleToggle = () => {
    dispatch(toggleMicThunk());
  };

  return (
    <Button
      onClick={handleToggle}
      variant={isMicOn ? "secondary" : "destructive"}
    >
      {isMicOn ? "마이크 끄기" : "마이크 켜기"}
    </Button>
  );
};
