// src/shared/hooks/useMediaTrack.ts
import { useAppSelector } from '@/shared/hooks/redux';
import { mediaTrackManager } from '@/shared/api/mediaTrackManager';
import { useMemo, useState, useEffect } from 'react';

// 로컬 미디어 트랙 Hook
// 로컬 미디어 트랙 Hook (수정됨)
export const useLocalMediaTrack = (kind: 'audio' | 'video') => {
  // 1. Redux에서 트랙의 메타데이터(상태)를 가져옵니다.
  const trackState = useAppSelector(state => state.media.local.tracks[kind]);

  // 2. trackId가 변경될 때마다 mediaTrackManager에서 실제 트랙 객체를 다시 조회합니다.
  const track = useMemo(() => {
    if (!trackState?.trackId) return null;
    // getLocalCameraTrack 대신 getTrackById를 사용하여 ID로 직접 조회
    const trackInfo = mediaTrackManager.getTrackById(trackState.trackId);
    return trackInfo?.track || null;
  }, [trackState?.trackId]); // 의존성을 trackId로 명확하게 지정

  return {
    track, // 실제 MediaStreamTrack 객체
    trackInfo: trackState, // Redux에 저장된 상태 정보
    enabled: trackState?.enabled ?? false,
    muted: trackState?.muted ?? false,
    hasTrack: !!trackState,
  };
};

// 원격 미디어 트랙 Hook (수정됨)
export const useRemoteMediaTrack = (socketId: string, kind: 'audio' | 'video') => {
  const trackState = useAppSelector(state => 
    state.media.remotePeers[socketId]?.tracks[kind]
  );
  
  const track = useMemo(() => {
    if (!trackState?.trackId) return null;
    // getRemoteTrack 대신 getTrackById를 사용하여 ID로 직접 조회
    const trackInfo = mediaTrackManager.getTrackById(trackState.trackId);
    return trackInfo?.track || null;
  }, [trackState?.trackId]); // 의존성을 trackId로 명확하게 지정

  return {
    track,
    trackInfo: trackState,
    enabled: trackState?.enabled ?? false,
    hasTrack: !!trackState,
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
  
  const toggleAudio = async () => {
    if (audioTrack.trackInfo) {
      // trackId를 사용하여 특정 트랙 토글
      await mediaTrackManager.toggleLocalTrack(audioTrack.trackInfo.trackId);
    } else {
      console.warn('❌ No audio track available to toggle');
    }
  };
  
  const toggleVideo = async () => {
    if (videoTrack.trackInfo) {
      // trackId를 사용하여 특정 트랙 토글
      await mediaTrackManager.toggleLocalTrack(videoTrack.trackInfo.trackId);
    } else {
      console.warn('❌ No video track available to toggle');
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
    if (!screenShareState.isSharing) return null;
    
    // peerId에 _screen 접미사가 붙은 트랙을 찾기
    const currentUser = 'local'; // 로컬 사용자를 위한 기본값
    return mediaTrackManager.getLocalScreenShareTrack();
  }, [screenShareState.isSharing]);
  
  return {
    track: screenTrack,
    isSharing: screenShareState.isSharing,
    isLoading: screenShareState.isLoading,
    error: screenShareState.error,
    hasScreenTrack: !!screenTrack,
  };
};

// 🆕 원격 화면 공유 Hook
export const useRemoteScreenShareTrack = (socketId: string) => {
  const screenTrack = useMemo(() => {
    return socketId ? mediaTrackManager.getRemoteScreenTrack(socketId) : null;
  }, [socketId]);
  
  return {
    track: screenTrack?.track || null,
    hasScreenTrack: !!screenTrack,
    socketId,
  };
};

// 🆕 모든 화면 공유 트랙 (로컬 + 원격) Hook
export const useAllScreenShareTracks = () => {
  const localScreenShare = useLocalScreenShareTrack();
  const remotePeers = useAllRemotePeers();
  
  // 강제 리렌더링을 위한 상태 (트랙 상태 변화 감지용)
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 주기적으로 트랙 상태 체크 (트랙이 끝났을 때를 감지하기 위함)
  useEffect(() => {
    const interval = setInterval(() => {
      let hasChanged = false;
      
      // 현재 활성 화면 공유 트랙들의 상태 체크
      remotePeers.forEach(peer => {
        const screenTrack = mediaTrackManager.getRemoteScreenTrack(peer.socketId);
        if (screenTrack?.track && screenTrack.track.readyState === 'ended') {
          hasChanged = true;
        }
      });
      
      if (hasChanged) {
        console.log('🔄 [useAllScreenShareTracks] Detected track state change, forcing refresh');
        setRefreshKey(prev => prev + 1);
      }
    }, 1000); // 1초마다 체크
    
    return () => clearInterval(interval);
  }, [remotePeers]);
  
  const remoteScreenShares = useMemo(() => {
    console.log('🔄 [useAllScreenShareTracks] Recalculating remote screen shares');
    
    const activeShares = remotePeers.map(peer => {
      const screenTrack = mediaTrackManager.getRemoteScreenTrack(peer.socketId);
      const track = screenTrack?.track;
      
      console.log(`🔍 [useAllScreenShareTracks] Peer ${peer.socketId}:`, {
        hasScreenTrack: !!screenTrack,
        hasTrack: !!track,
        readyState: track?.readyState,
        isActive: screenTrack && track && track.readyState === 'live'
      });
      
      return {
        socketId: peer.socketId,
        peerName: peer.peerName,
        screenTrack,
      };
    }).filter(peer => {
      // 화면 공유 트랙이 있고, 트랙이 활성 상태인 경우만 포함
      const track = peer.screenTrack?.track;
      const isActive = peer.screenTrack && track && track.readyState === 'live';
      
      if (peer.screenTrack && !isActive) {
        console.log(`⚠️ [useAllScreenShareTracks] Filtering out inactive screen share for ${peer.socketId}`);
      }
      
      return isActive;
    });
    
    console.log(`✅ [useAllScreenShareTracks] Active remote screen shares: ${activeShares.length}`);
    return activeShares;
  }, [remotePeers, refreshKey]); // refreshKey를 dependency에 추가
  
  return {
    localScreenShare,
    remoteScreenShares,
    hasAnyScreenShare: localScreenShare.hasScreenTrack || remoteScreenShares.length > 0,
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