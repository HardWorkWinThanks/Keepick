// src/features/screen-share/hooks/useScreenShare.ts
import { useMemo, useCallback } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { screenShareManager } from '@/shared/api/screenShareManager';

export const useScreenShareStream = (peerId?: string) => {
  const isLocalSharing = useAppSelector(state => state.screenShare.isSharing);
  const remoteShare = useAppSelector(state => 
    peerId ? state.screenShare.remoteScreenShares[peerId] : null
  );
  
  return useMemo(() => {
    if (!peerId) {
      // 로컬 화면 공유 - 더 정확한 조건 체크
      return isLocalSharing ? screenShareManager.getLocalScreenStream() : null;
    } else {
      // 원격 화면 공유 - null 체크 개선
      return remoteShare?.isActive ? screenShareManager.getRemoteScreenStream(peerId) : null;
    }
  }, [peerId, isLocalSharing, remoteShare?.isActive]);
};

export const useScreenShareState = () => {
  return useAppSelector(state => state.screenShare);
};

export const useRemoteScreenShares = () => {
  const remoteScreenShares = useAppSelector(state => state.screenShare.remoteScreenShares);
  
  return useMemo(() => {
    return Object.values(remoteScreenShares).filter(
      screenShare => screenShare.isActive
    );
  }, [remoteScreenShares]);
};

export const useActiveScreenShareCount = () => {
  return useAppSelector(state => state.screenShare.activeScreenShareCount);
};

// 화면 공유 컨트롤을 위한 추가 Hook
export const useScreenShareControls = (roomId: string) => {
  const { isSharing, isLoading, error } = useAppSelector(state => state.screenShare);
  const { userName } = useAppSelector(state => state.session);
  
  const toggleScreenShare = useCallback(async (socketId: string) => {
    console.log(`🔄 Toggle screen share:`, { isSharing, socketId, roomId });
    if (isSharing) {
      // 화면 공유 중지 - socketId를 그대로 전달 (stopScreenShare에서 정규화 처리)
      await screenShareManager.stopScreenShare(roomId, socketId);
    } else {
      // 화면 공유 시작 - socketId를 그대로 전달 (startScreenShare에서 "_screen" 접미사 추가)
      await screenShareManager.startScreenShare(roomId, socketId, userName);
    }
  }, [roomId, userName, isSharing]);
  
  return {
    isSharing,
    isLoading,
    error,
    toggleScreenShare
  };
};