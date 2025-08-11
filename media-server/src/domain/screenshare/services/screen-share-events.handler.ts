import { Socket } from 'socket.io';
import { ScreenShareService } from './screen-share.service';
import { logger } from '../../../utils/logger';

export class ScreenShareEventsHandler {
  constructor(
    private screenShareService: ScreenShareService
  ) {}

  handleConnection(socket: Socket): void {
    // 화면 공유 시작
    socket.on('start-screen-share', async (data, callback) => {
      try {
        const { roomId, peerId, rtpParameters } = data;
        
        logger.info(`Screen share start request from peer ${peerId} in room ${roomId}`);

        const result = await this.screenShareService.startScreenShare({
          roomId,
          peerId,
          rtpParameters
        });

        // 방의 다른 참가자들에게 화면 공유 시작 알림
        socket.to(roomId).emit('screen-share-started', {
          peerId,
          producerId: result.producerId
        });

        callback({ success: true, producerId: result.producerId });
      } catch (error) {
        logger.error('Start screen share error:', error);
        callback({ success: false, error: error });
      }
    });

    // 화면 공유 중지
    socket.on('stop-screen-share', async (data, callback) => {
      try {
        const { roomId, peerId, producerId } = data;
        
        logger.info(`Screen share stop request from peer ${peerId} in room ${roomId}`);

        await this.screenShareService.stopScreenShare({
          roomId,
          peerId,
          producerId
        });

        // 방의 다른 참가자들에게 화면 공유 중지 알림
        socket.to(roomId).emit('screen-share-stopped', {
          peerId,
          producerId
        });

        callback({ success: true });
      } catch (error) {
        logger.error('Stop screen share error:', error);
        callback({ success: false, error: error });
      }
    });

    // 화면 공유 consume
    socket.on('consume-screen-share', async (data, callback) => {
      try {
        const { roomId, peerId, producerId, rtpCapabilities } = data;
        
        logger.info(`Screen share consume request from peer ${peerId} in room ${roomId}`);

        const result = await this.screenShareService.consumeScreenShare({
          roomId,
          peerId,
          producerId,
          rtpCapabilities
        });

        callback({ 
          success: true, 
          params: result.params
        });
      } catch (error) {
        logger.error('Consume screen share error:', error);
        callback({ success: false, error: error });
      }
    });

    // 화면 공유 consumer resume
    socket.on('resume-screen-share-consumer', async (data, callback) => {
      try {
        const { consumerId, peerId } = data;
        
        await this.screenShareService.resumeConsumer(consumerId, peerId);
        callback({ success: true });
      } catch (error) {
        logger.error('Resume screen share consumer error:', error);
        callback({ success: false, error: error });
      }
    });

    // 화면 공유 consumer pause
    socket.on('pause-screen-share-consumer', async (data, callback) => {
      try {
        const { consumerId, peerId } = data;
        
        await this.screenShareService.pauseConsumer(consumerId, peerId);
        callback({ success: true });
      } catch (error) {
        logger.error('Pause screen share consumer error:', error);
        callback({ success: false, error: error });
      }
    });

    // 현재 화면 공유 상태 확인
    socket.on('get-screen-share-status', async (data, callback) => {
      try {
        const { roomId } = data;
        
        const isActive = this.screenShareService.isScreenShareActive(roomId);
        const activeShare = this.screenShareService.getActiveScreenShare(roomId);

        callback({ 
          success: true, 
          isActive,
          screenShare: activeShare ? {
            producerId: activeShare.id,
            peerId: activeShare.peerId
          } : null
        });
      } catch (error) {
        logger.error('Get screen share status error:', error);
        callback({ success: false, error: error });
      }
    });

    // 연결 해제 시 정리
    socket.on('disconnect', () => {
      // 필요시 정리 작업 수행
      logger.info(`Peer disconnected: ${socket.id}`);
    });
  }
}