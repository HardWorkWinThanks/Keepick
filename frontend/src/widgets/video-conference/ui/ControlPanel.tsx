import React from "react";

interface ControlPanelProps {
  roomId: string;
  setRoomId: (roomId: string) => void;
  isInRoom: boolean;
  isConnected: boolean;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
}
export const ControlPanel: React.FC<ControlPanelProps> = ({
  roomId,
  setRoomId,
  isInRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  return (
    <div className="flex items-center p-4 bg-gray-800 rounded-lg shadow-md">
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="룸 이름 입력"
        disabled={isInRoom}
        className="px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
      />
      <button
        onClick={!isInRoom ? onJoinRoom : onLeaveRoom}
        className={`ml-4 px-4 py-2 font-bold text-white rounded-md transition-colors ${
          !isInRoom
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {!isInRoom ? "🚪 룸 참가" : "🚪 룸 나가기"}
      </button>
    </div>
  );
};