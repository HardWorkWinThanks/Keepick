"use client";

import { BoltIcon } from "@heroicons/react/24/outline";

interface TierControlsProps {
  precisionTierMode: boolean;
  onPrecisionModeToggle: () => void;
  onSave: () => void;
}

export function TierControls({
  precisionTierMode,
  onPrecisionModeToggle,
  onSave,
}: TierControlsProps) {
  return (
    <>
      <button
        onClick={onPrecisionModeToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
  transition-all duration-300 ${
    precisionTierMode
      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }`}
      >
        <BoltIcon className="w-5 h-5" />
        <span className="hidden sm:block">
          {precisionTierMode ? "배틀 활성화됨" : "정밀 배틀"}
        </span>
      </button>
      <button
        onClick={onSave}
        className="px-5 py-2 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600       
  shadow-sm transition-all"
      >
        💾 저장
      </button>
    </>
  );
}
