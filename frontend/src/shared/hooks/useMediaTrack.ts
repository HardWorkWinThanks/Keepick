// src/shared/hooks/useMediaTrack.ts
import { useAppSelector } from '@/shared/hooks/redux';
import { mediaTrackManager } from '@/shared/api/mediaTrackManager';
import { useMemo } from 'react';

// 로컬 미디어 트랙 Hook
export const useLocalMediaTrack = (kind: 'audio' | 'video') => {
  const trackInfo = useAppSelector(state => state.media.local.tracks[kind]);
  
  const track = useMemo(() => {
    // 🆕 카메라 전용 메서드 사용 (화면 공유와 완전 분리)
    return trackInfo ? mediaTrackManager.getLocalCameraTrack(kind) : null;
  }, [trackInfo?.trackId, kind]);

  // 디버깅을 위한 로그 제거 (필요시 활성화)

  return {
    track,
    trackInfo,
    enabled: trackInfo?.enabled ?? false,
    muted: trackInfo?.muted ?? false,
    hasTrack: !!trackInfo,
  };
};

// 원격 미디어 트랙 Hook
export const useRemoteMediaTrack = (socketId: string, kind: 'audio' | 'video') => {
  const trackInfo = useAppSelector(state => 
    state.media.remotePeers[socketId]?.tracks[kind]
  );
  
  const track = useMemo(() => {
    return trackInfo ? mediaTrackManager.getRemoteTrack(socketId, kind) : null;
  }, [trackInfo, socketId, kind]);

  return {
    track,
    trackInfo,
    enabled: trackInfo?.enabled ?? false,
    hasTrack: !!trackInfo,
  };
};

// 피어의 모든 미디어 Hook
export const useRemotePeerMedia = (socketId: string) => {
  const peerData = useAppSelector(state => state.media.remotePeers[socketId]);
  
  const audioTrack = useMemo(() => 
    peerData?.tracks.audio ? mediaTrackManager.getRemoteTrack(socketId, 'audio') : null,
    [peerData?.tracks.audio, socketId]
  );
  
  const videoTrack = useMemo(() => 
    peerData?.tracks.video ? mediaTrackManager.getRemoteTrack(socketId, 'video') : null,
    [peerData?.tracks.video, socketId]
  );

  return {
    peerData,
    audioTrack,
    videoTrack,
    hasAudio: !!peerData?.tracks.audio?.enabled,
    hasVideo: !!peerData?.tracks.video?.enabled,
    connected: peerData?.connected ?? false,
  };
};

// 모든 원격 피어 Hook
export const useAllRemotePeers = () => {
  const remotePeers = useAppSelector(state => state.media.remotePeers);
  
  return useMemo(() => Object.values(remotePeers), [remotePeers]);
};

// 로컬 미디어 제어 Hook
export const useLocalMediaControls = () => {
  const audioTrack = useLocalMediaTrack('audio');
  const videoTrack = useLocalMediaTrack('video');
  
  const toggleAudio = () => {
    if (audioTrack.trackInfo) {
      mediaTrackManager.toggleLocalTrack(audioTrack.trackInfo.trackId);
    }
  };
  
  const toggleVideo = () => {
    if (videoTrack.trackInfo) {
      mediaTrackManager.toggleLocalTrack(videoTrack.trackInfo.trackId);
    }
  };
  
  return {
    audio: audioTrack,
    video: videoTrack,
    toggleAudio,
    toggleVideo,
    hasLocalMedia: audioTrack.hasTrack || videoTrack.hasTrack,
  };
};

// 🆕 화면 공유 전용 Hook
export const useLocalScreenShareTrack = () => {
  const screenShareState = useAppSelector(state => state.screenShare);
  
  const screenTrack = useMemo(() => {
    // 화면 공유가 활성화된 경우에만 트랙 반환
    return screenShareState.isSharing ? mediaTrackManager.getLocalScreenShareTrack() : null;
  }, [screenShareState.isSharing]);
  
  return {
    track: screenTrack,
    isSharing: screenShareState.isSharing,
    isLoading: screenShareState.isLoading,
    error: screenShareState.error,
    hasScreenTrack: !!screenTrack,
  };
};

// 디바이스 관리 Hook
export const useMediaDevices = () => {
  const devices = useAppSelector(state => state.media.local.devices);
  
  return {
    audioDevices: devices.audioDevices,
    videoDevices: devices.videoDevices,
    selectedAudioDevice: devices.selectedAudioDevice,
    selectedVideoDevice: devices.selectedVideoDevice,
  };
};

// Transport 상태 Hook
export const useTransportState = () => {
  const transports = useAppSelector(state => state.media.transports);
  const device = useAppSelector(state => state.media.device);
  
  return {
    connected: transports.connected,
    deviceLoaded: device.loaded,
    sendTransportId: transports.sendTransportId,
    recvTransportId: transports.recvTransportId,
  };
};