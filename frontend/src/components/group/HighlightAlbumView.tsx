// src/components/group/HighlightAlbumView.tsx
"use client";

import React from 'react';

interface HighlightAlbumViewProps {
  albumId: string;
}

const HighlightAlbumView: React.FC<HighlightAlbumViewProps> = ({ albumId }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">하이라이트 앨범</h2>
      <p>앨범 ID: {albumId}</p>
      {/* 하이라이트 앨범 내용 구현 */}
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">하이라이트 앨범 뷰가 여기에 표시됩니다.</p>
      </div>
    </div>
  );
};

export default HighlightAlbumView;
