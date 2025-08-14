// src/shared/hooks/useRemoteStream.ts
import { useState, useEffect } from 'react';
import { mediasoupManager } from '@/shared/api/mediasoupManager';

/**
 * 주어진 socketId에 해당하는 원격 MediaStream을 관리하고 반환하는 커스텀 훅.
 * mediasoupManager의 'stream-updated' 이벤트를 구독하여 스트림 변경 시 자동으로 업데이트합니다.
 *
 * @param socketId 원격 사용자의 소켓 ID. undefined인 경우 null을 반환합니다.
 * @returns 해당 socketId의 MediaStream 객체 또는 null.
 */
export const useRemoteStream = (socketId: string | undefined): MediaStream | null => {
  // useState의 초기값 함수는 컴포넌트의 첫 렌더링 시에만 실행됩니다.
  // mediasoupManager에서 현재 스트림을 가져와 복제하여 초기값으로 설정합니다.
  const [stream, setStream] = useState<MediaStream | null>(() => {
    const initialStream = socketId ? mediasoupManager.getRemoteStream(socketId) : null;
    return initialStream ? initialStream.clone() : null;
  });

  useEffect(() => {
    // socketId가 없으면 스트림을 null로 설정하고 이 effect를 종료합니다.
    if (!socketId) {
      setStream(null);
      return;
    }

    // 스트림이 업데이트되면 실행될 콜백 함수
    const handleStreamUpdate = ({ socketId: updatedSocketId, stream: updatedStream }: { socketId: string, stream: MediaStream | null }) => {
      // 이 훅이 감시하는 socketId와 일치할 때만 상태를 업데이트합니다.
      if (updatedSocketId === socketId) {
        console.log(`[useRemoteStream Hook] - ${socketId}의 스트림 업데이트 감지`);
        // clone()을 통해 항상 새로운 스트림 객체를 생성하여 React가 참조 변경을 감지하도록 합니다.
        setStream(updatedStream ? updatedStream.clone() : null);
      }
    };
    
    // mediasoupManager의 'stream-updated' 이벤트를 구독합니다.
    mediasoupManager.on('stream-updated', handleStreamUpdate);

    // ⭐ 중요: 이 effect가 실행되는 시점의 최신 스트림 상태로 동기화합니다.
    // 이는 socketId가 바뀌었을 때나, 이벤트 리스너가 등록되기 전에 스트림이 변경되었을 경우를 처리합니다.
    const currentManagerStream = mediasoupManager.getRemoteStream(socketId);
    setStream(currentManagerStream ? currentManagerStream.clone() : null);

    // 컴포넌트가 언마운트되거나 socketId가 변경될 때 이벤트 리스너를 정리합니다.
    return () => {
      mediasoupManager.off('stream-updated', handleStreamUpdate);
    };
    
  }, [socketId]); // 이 effect는 오직 socketId가 변경될 때만 재실행됩니다.

  // 현재 관리되는 스트림 상태를 반환합니다.
  return stream;
};

