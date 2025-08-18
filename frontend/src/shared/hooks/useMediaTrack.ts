// src/shared/hooks/useMediaTrack.ts
import { useAppSelector } from '@/shared/hooks/redux';
import { mediaTrackManager } from '@/shared/api/mediaTrackManager';
import { useMemo, useState, useEffect } from 'react';

// 로컬 미디어 트랙 Hook
// 로컬 미디어 트랙 Hook (개선된 안전한 조회)
export const useLocalMediaTrack = (kind: 'audio' | 'video') => {
  // 1. Redux에서 트랙의 메타데이터(상태)를 가져옵니다.
  const trackState = useAppSelector(state => state.media.local.tracks[kind]);

  // 2. 안전한 트랙 조회: trackId와 fallback 조회 모두 시도 (화면공유와 완전 분리)
  const track = useMemo(() => {
    console.log(`🔍 [useLocalMediaTrack] Looking for ${kind} track - Redux trackId: ${trackState?.trackId}`);
    
    if (!trackState?.trackId) {
      console.log(`🔍 No trackId in Redux for ${kind}, trying direct camera track lookup`);
      // Redux에 trackId가 없으면 직접 카메라 전용 트랙 조회
      const cameraTrack = mediaTrackManager.getLocalCameraTrack(kind);
      if (cameraTrack) {
        console.log(`✅ [useLocalMediaTrack] Found ${kind} camera track via direct lookup`);
      } else {
        console.warn(`⚠️ [useLocalMediaTrack] No ${kind} camera track found via direct lookup`);
      }
      return cameraTrack;
    }
    
    // trackId가 있으면 먼저 ID로 조회
    const trackInfo = mediaTrackManager.getTrackById(trackState.trackId);
    if (trackInfo?.track && trackInfo.trackType === "camera") {
      console.log(`✅ [useLocalMediaTrack] Found ${kind} camera track by ID: ${trackState.trackId}`);
      return trackInfo.track;
    }
    
    // ID로 찾지 못하거나 카메라 트랙이 아닌 경우 fallback으로 카메라 트랙 조회
    if (trackInfo?.trackType !== "camera") {
      console.warn(`⚠️ [useLocalMediaTrack] Track ${trackState.trackId} is not a camera track (${trackInfo?.trackType}), using camera fallback`);
    } else {
      console.warn(`⚠️ [useLocalMediaTrack] Track not found by ID ${trackState.trackId}, trying camera fallback for ${kind}`);
    }
    
    const fallbackTrack = mediaTrackManager.getLocalCameraTrack(kind);
    if (fallbackTrack) {
      console.log(`🔄 [useLocalMediaTrack] Found ${kind} camera track via fallback`);
    } else {
      console.error(`❌ [useLocalMediaTrack] No ${kind} camera track found even via fallback!`);
    }
    return fallbackTrack;
  }, [trackState?.trackId, kind]); // kind도 의존성에 추가

  return {
    track, // 실제 MediaStreamTrack 객체
    trackInfo: trackState, // Redux에 저장된 상태 정보
    enabled: trackState?.enabled ?? false,
    muted: trackState?.muted ?? false,
    hasTrack: !!trackState,
  };
};

// 원격 미디어 트랙 Hook (카메라 트랙만 필터링)
export const useRemoteMediaTrack = (socketId: string, kind: 'audio' | 'video') => {
  const trackState = useAppSelector(state => 
    state.media.remotePeers[socketId]?.tracks[kind]
  );
  
  const track = useMemo(() => {
    if (!trackState?.trackId) return null;
    
    // 🎯 카메라 트랙만 조회하여 화면공유 트랙과 완전 분리
    const trackInfo = mediaTrackManager.getTrackById(trackState.trackId);
    
    // 화면공유 트랙이면 null 반환 (UserVideoCard는 카메라 트랙만 처리)
    if (trackInfo?.trackType === "screen") {
      console.log(`🛡️ [useRemoteMediaTrack] Filtering out screen track ${trackState.trackId} for UserVideoCard`);
      return null;
    }
    
    // 카메라 트랙만 반환
    if (trackInfo?.trackType === "camera") {
      console.log(`✅ [useRemoteMediaTrack] Using camera track ${trackState.trackId} for ${socketId}`);
      return trackInfo.track;
    }
    
    console.warn(`⚠️ [useRemoteMediaTrack] Unknown track type for ${trackState.trackId}: ${trackInfo?.trackType}`);
    return null;
  }, [trackState?.trackId, socketId]); // socketId도 의존성에 추가

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
  const screenTrackInfo = useMemo(() => {
    return socketId ? mediaTrackManager.getRemoteScreenTrack(socketId) : null;
  }, [socketId]);
  
  return {
    track: screenTrackInfo?.track || null,
    trackInfo: screenTrackInfo, // TrackInfo 전체 반환
    trackId: screenTrackInfo?.trackId || null, // 내부 trackId 
    hasScreenTrack: !!screenTrackInfo,
    socketId,
  };
};

// 🆕 모든 화면 공유 트랙 (로컬 + 원격) Hook
export const useAllScreenShareTracks = () => {
  const localScreenShare = useLocalScreenShareTrack();
  const remotePeers = useAllRemotePeers();
  
  // 강제 리렌더링을 위한 상태 (트랙 상태 변화 감지용)
  const [refreshKey, setRefreshKey] = useState(0);
  
  console.log(`🔄 [useAllScreenShareTracks] Hook executed - refreshKey: ${refreshKey}`);
  
  // 주기적으로 트랙 상태 체크 (새로운 화면공유 트랙 감지 및 끝난 트랙 감지)
  useEffect(() => {
    const interval = setInterval(() => {
      // 현재 MediaTrackManager에서 실제 화면공유 트랙 수 확인
      const currentScreenPeers = mediaTrackManager.getAllRemoteScreenSharePeers();
      const currentCount = currentScreenPeers.length;
      
      // 이전 refreshKey와 현재 트랙 수를 비교하여 변화 감지
      const expectedCount = Math.floor(refreshKey / 100); // refreshKey를 100 단위로 인코딩
      
      if (currentCount !== expectedCount) {
        console.log(`🔄 [useAllScreenShareTracks] Screen share count changed: ${expectedCount} -> ${currentCount}`);
        setRefreshKey(currentCount * 100 + Date.now() % 100); // 트랙 수와 타임스탬프 조합
      }
      
      // 기존 ended 트랙 체크도 유지
      let hasEndedTrack = false;
      remotePeers.forEach(peer => {
        const screenTrack = mediaTrackManager.getRemoteScreenTrack(peer.socketId);
        if (screenTrack?.track && screenTrack.track.readyState === 'ended') {
          hasEndedTrack = true;
        }
      });
      
      if (hasEndedTrack) {
        console.log('🔄 [useAllScreenShareTracks] Detected ended track, forcing refresh');
        setRefreshKey(prev => prev + 1);
      }
    }, 500); // 500ms마다 체크 (더 빠른 감지)
    
    return () => clearInterval(interval);
  }, [remotePeers, refreshKey]);
  
  const remoteScreenShares = useMemo(() => {
    console.log('🔄 [useAllScreenShareTracks] Recalculating remote screen shares');
    
    // 🆕 MediaTrackManager에서 직접 화면 공유 트랙을 가진 모든 피어 찾기
    const allScreenSharePeers = mediaTrackManager.getAllRemoteScreenSharePeers();
    console.log(`🔍 [useAllScreenShareTracks] Found ${allScreenSharePeers.length} peers with screen tracks from MediaTrackManager`);
    
    const activeShares = allScreenSharePeers.map(({ socketId, peerName: fallbackName }) => {
      const screenTrack = mediaTrackManager.getRemoteScreenTrack(socketId);
      const track = screenTrack?.track;
      
      // Redux에서 피어 정보를 찾아 실제 peerName 사용, 없으면 fallback 사용
      const reduxPeer = remotePeers.find(peer => peer.socketId === socketId);
      const peerName = reduxPeer?.peerName || fallbackName || socketId;
      
      console.log(`🔍 [useAllScreenShareTracks] Screen peer ${socketId} (${peerName}):`, {
        hasScreenTrack: !!screenTrack,
        hasTrack: !!track,
        readyState: track?.readyState,
        isActive: screenTrack && track && track.readyState === 'live',
        reduxPeerFound: !!reduxPeer
      });
      
      return {
        socketId,
        peerName,
        screenTrack,
        trackId: screenTrack?.trackId || null,
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
  }, [remotePeers, refreshKey]); // remotePeers를 다시 의존성에 추가 (peerName lookup용)
  
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