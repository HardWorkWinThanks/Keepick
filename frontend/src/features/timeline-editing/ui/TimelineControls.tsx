"use client";

import { PlusIcon } from "@heroicons/react/24/outline";

interface TimelineControlsProps {
  onAddEvent: () => void;
}

export function TimelineControls({ onAddEvent }: TimelineControlsProps) {
  return (
    <button
      onClick={onAddEvent}
      className="px-5 py-2 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600       
  shadow-sm transition-all flex items-center gap-2"
    >
      <PlusIcon className="w-5 h-5" /> 추억 추가
    </button>
  );
}
