import React from "react";

interface StatusDisplayProps {
  isConnected: boolean;
  connectionState: string;
  users: { id: string }[];
  isInRoom: boolean;
  error: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  isConnected,
  connectionState,
  users,
  isInRoom,
  error,
}) => {
  return (
    <>
      {/* ▼▼▼▼▼ 수정된 부분: 배경 및 텍스트 색상 복구 ▼▼▼▼▼ */}
      <div className="p-4 bg-gray-700/70 rounded-lg shadow-md space-y-1 text-sm text-gray-300">
        <h3 className="text-lg font-semibold mb-2 text-white">연결 상태</h3>
        <p>📡 Socket: {isConnected ? "✅ 연결됨" : "❌ 연결 안됨"}</p>
        <p>🔗 P2P 연결: {connectionState}</p>
        <p>👥 참가자: {users.length + (isInRoom ? 1 : 0)}명</p>
      </div>
      {/* ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲ */}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg">
          ❌ {error}
        </div>
      )}
    </>
  );
};
