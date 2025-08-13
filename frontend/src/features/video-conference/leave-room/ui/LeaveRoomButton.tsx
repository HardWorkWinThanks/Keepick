// src/features/video-conference/leave-room/ui/LeaveRoomButton.tsx
"use client";

import { useAppDispatch } from "@/shared/hooks/redux";
import { leaveRoomThunk } from "@/entities/video-conference/session/model/thunks";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";

export const LeaveRoomButton = () => {
  const dispatch = useAppDispatch();

  const handleLeave = () => {
    if (confirm("회의를 종료하시겠습니까?")) {
      dispatch(leaveRoomThunk());
    }
  };

  return (
    <button
      onClick={handleLeave}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-colors"
      aria-label="회의 종료"
    >
      <ArrowRightOnRectangleIcon className="h-6 w-6" />
    </button>
  );
};
