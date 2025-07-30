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
      {/* 연결 상태 */}
      <div style={{ marginBottom: "20px" }}>
        <p>📡 Socket: {isConnected ? "✅ 연결됨" : "❌ 연결 안됨"}</p>
        <p>🔗 P2P 연결: {connectionState}</p>
        <p>👥 참가자: {users.length + (isInRoom ? 1 : 0)}명</p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
        >
          ❌ {error}
        </div>
      )}
    </>
  );
};
