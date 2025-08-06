"use client";

import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

interface AlbumControlsProps {
  albumTitle: string;
  onBack: () => void;
  children?: React.ReactNode; // 추가 컨트롤들 (정밀 배틀, 저장 버튼 등)
}

export function AlbumControls({
  albumTitle,
  onBack,
  children,
}: AlbumControlsProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 mb-4 p-4 bg-white rounded-xl
  shadow-md border"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowUturnLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 truncate">
          {albumTitle}
        </h2>
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  );
}
