// src/components/group/TimelineAlbumView.tsx
"use client";

import React from 'react';

interface TimelineAlbumViewProps {
  albumId: string;
}

const TimelineAlbumView: React.FC<TimelineAlbumViewProps> = ({ albumId }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">타임라인 앨범</h2>
      <p>앨범 ID: {albumId}</p>
      {/* 타임라인 앨범 내용 구현 */}
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">타임라인 앨범 뷰가 여기에 표시됩니다.</p>
      </div>
    </div>
  );
};

export default TimelineAlbumView;
