// src/widgets/video-conference/ui/ControlPanel.tsx
import React from "react";

// Props 타입 정의에 제스처 상태와 핸들러 추가
interface ControlPanelProps {
  roomId: string;
  setRoomId: (roomId: string) => void;
  isInRoom: boolean;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  isStaticGestureOn: boolean;
  setStaticGestureOn: (isOn: boolean) => void;
  isDynamicGestureOn: boolean;
  setDynamicGestureOn: (isOn: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  roomId,
  setRoomId,
  isInRoom,
  onJoinRoom,
  onLeaveRoom,
  isStaticGestureOn,
  setStaticGestureOn,
  isDynamicGestureOn,
  setDynamicGestureOn,
}) => {
  // 토글 스위치 스타일을 위한 내부 컴포넌트
  const ToggleSwitch: React.FC<{
    label: string;
    isOn: boolean;
    onToggle: () => void;
  }> = ({ label, isOn, onToggle }) => (
    <div className="flex items-center justify-between">
      {/* ▼▼▼▼▼ 수정된 부분: 텍스트 및 버튼 색상 복구 ▼▼▼▼▼ */}
      <span className="text-gray-300">{label}</span>
      <button
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
          isOn ? "bg-blue-600" : "bg-gray-600"
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            isOn ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* === 룸 제어 섹션 === */}
      <div className="p-4 bg-gray-700/70 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-white">룸 제어</h3>
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="룸 이름 입력"
            disabled={isInRoom}
            className="px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
          />
          <button
            onClick={!isInRoom ? onJoinRoom : onLeaveRoom}
            className={`w-full px-4 py-2 font-bold text-white rounded-md transition-colors ${
              !isInRoom
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {!isInRoom ? "🚪 룸 참가" : "🚪 룸 나가기"}
          </button>
        </div>
      </div>

      {/* === AI 제스처 설정 섹션 === */}
      <div className="p-4 bg-gray-700/70 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-white">
          AI 제스처 설정
        </h3>
        <div className="space-y-3">
          <ToggleSwitch
            label="정적 제스처 (손모양)"
            isOn={isStaticGestureOn}
            onToggle={() => setStaticGestureOn(!isStaticGestureOn)}
          />
          <ToggleSwitch
            label="동적 제스처 (움직임)"
            isOn={isDynamicGestureOn}
            onToggle={() => setDynamicGestureOn(!isDynamicGestureOn)}
          />
        </div>
      </div>
      {/* ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲ */}
    </div>
  );
};
