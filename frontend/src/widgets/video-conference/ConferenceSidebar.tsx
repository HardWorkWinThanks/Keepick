// src/widgets/video-conference/ConferenceSidebar.tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { UserIcon, WifiIcon } from "@heroicons/react/24/solid";
import {
  toggleStaticGesture,
  toggleDynamicGesture,
} from "@/entities/video-conference/gesture/model/slice";
import { LeaveRoomButton } from "@/features/video-conference/leave-room/ui/LeaveRoomButton";

// 간단한 토글 스위치 UI 컴포넌트
const ToggleSwitch = ({
  label,
  isOn,
  onToggle,
}: {
  label: string;
  isOn: boolean;
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-[#A0A0A5]">{label}</span>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? "bg-[#FE7A25]" : "bg-[#424245]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export const ConferenceSidebar = () => {
  const dispatch = useAppDispatch();

  const { isConnected, status, users, error, roomId, userName } =
    useAppSelector((state) => state.session);
  const { isStaticGestureOn, isDynamicGestureOn } = useAppSelector(
    (state) => state.gesture
  );

  const getStatusText = () => {
    if (!isConnected) return "서버 연결 중...";
    if (status === "pending") return "회의 참가 중...";
    if (status === "failed") return "참가 실패";
    if (status === "succeeded") return "연결됨";
    return "연결 준비 완료";
  };

  return (
    <aside className="w-80 bg-[#2C2C2E] text-[#FFFFFF] p-4 flex flex-col space-y-6">
      <div className="text-lg font-bold text-[#FFFFFF] font-header">
        회의 정보 ({roomId})
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <WifiIcon className="h-5 w-5 text-[#FE7A25]" />
          <span className="text-[#FFFFFF]">연결 상태: {getStatusText()}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-[#FCBC34]" />
          <span className="text-[#FFFFFF]">참가자: {users.length + 1}명</span>
        </div>
        {error && <p className="text-[#D22016]">에러: {error}</p>}
      </div>

      <div className="flex-grow overflow-y-auto">
        <h3 className="font-semibold mb-2 text-[#FFFFFF]">참가자 목록</h3>
        <ul className="space-y-2">
          <li className="text-[#FE7A25]">{userName} (나)</li>
          {users.map((user) => (
            <li key={user.id} className="text-[#A0A0A5]">
              {user.name}
            </li>
          ))}
        </ul>
      </div>

      {/* 제스처 설정 */}
      <div>
        <h3 className="font-semibold mb-2 text-[#FFFFFF]">AI 제스처</h3>
        <div className="space-y-3 p-3 bg-[#222222] rounded-lg">
          <ToggleSwitch
            label="정적 제스처"
            isOn={isStaticGestureOn}
            onToggle={() => dispatch(toggleStaticGesture())}
          />
          <ToggleSwitch
            label="동적 제스처"
            isOn={isDynamicGestureOn}
            onToggle={() => dispatch(toggleDynamicGesture())}
          />
        </div>
      </div>

      {/* 나가기 버튼 (피처) */}
      <div className="mt-auto">
        <LeaveRoomButton />
      </div>
    </aside>
  );
};
