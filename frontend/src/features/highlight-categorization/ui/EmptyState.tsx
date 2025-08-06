"use client";

import { CursorArrowRaysIcon } from "@heroicons/react/24/outline";

export function EmptyState() {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-xl shadow-lg border animate-fade-in">
      <CursorArrowRaysIcon className="mx-auto h-16 w-16 text-teal-400 mb-4" />
      <h3 className="text-2xl font-bold text-gray-800">
        어떤 순간이 궁금하신가요?
      </h3>
      <p className="mt-2 text-md text-gray-500">
        궁금한 순간을 선택하여 그날의 기억을 확인해보세요!
      </p>
    </div>
  );
}
