// src/domain/screenshare/services/screen-share-events.handler.ts

import { Socket } from 'socket.io';
import { logger } from '../../../utils/logger';
import { RoomService } from '../../room/service/room.service';
import { MediaEventsHandler } from '../../media/media-events.handler';
import { ScreenShareService } from './screen-share.service';
import {
  StartScreenShareData,
  StopScreenShareData,
  ConsumeScreenShareData,
  ScreenShareEvent,
  ScreenShareProducerInfo,
} from '../types/screen-share.types';

export class ScreenShareEventsHandler {
  constructor(
    private screenShareService: ScreenShareService,
    private roomService: RoomService,
    private mediaEventsHandler: MediaEventsHandler
  ) {}

  // 화면 공유 시작 처리
  async handleStartScreenShare(socket: Socket, data: StartScreenShareData): Promise<void> {
    try {
      console.log(`Received start-screen-share from socket: ${socket.id}`, data);
      logger.info('Received start-screen-share event', {
        socketId: socket.id,
        roomId: data.roomId,
        peerId: data.peerId || socket.id,
      });

      const { roomId, transportId, rtpParameters } = data;
      const peerId = data.peerId || socket.id;

      // 이미 화면 공유 중인지 확인
      const existingProducer = this.screenShareService.getProducerByPeer(roomId, peerId);
      if (existingProducer && existingProducer.active) {
        console.log(`Screen share already active for peer: ${peerId}`);
        socket.emit('screen_share_error', {
          error: 'Screen share already active for this peer',
        });
        return;
      }

      // 기존 MediaEventsHandler의 produce 로직 활용
      const produceData = {
        transportId,
        kind: 'video' as const,
        rtpParameters,
        roomId,
        appData: { type: 'screenshare', peerId }
      };

      // Producer 생성 처리
      await this.handleScreenShareProduce(socket, produceData);

    } catch (error) {
      console.error('Error handling start-screen-share:', error);
      logger.error('Error handling start-screen-share', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit('screen_share_error', {
        error: error instanceof Error ? error.message : 'Failed to start screen share',
      });
    }
  }

  // 화면 공유 중지 처리
  async handleStopScreenShare(socket: Socket, data: StopScreenShareData): Promise<void> {
    try {
      console.log(`Received stop-screen-share from socket: ${socket.id}`, data);
      logger.info('Received stop-screen-share event', {
        socketId: socket.id,
        roomId: data.roomId,
        peerId: data.peerId || socket.id,
        producerId: data.producerId,
      });

      const { roomId, producerId } = data;
      const peerId = data.peerId || socket.id;

      const response = await this.screenShareService.stopScreenShare({
        roomId,
        peerId,
        producerId,
      });

      if (response.success) {
        console.log(`Screen share stopped successfully`);
        
        // 기존 room service를 통해 producer 정리
        const peer = this.roomService.getPeer(socket.id);
        if (peer && peer.producers.has(producerId)) {
          const producer = peer.producers.get(producerId);
          if (producer) {
            producer.close();
            peer.producers.delete(producerId);
            console.log(`Producer ${producerId} closed and removed from peer`);
          }
        }
        
        // 같은 방의 다른 피어들에게 화면 공유 종료 알림
        const screenShareEvent: ScreenShareEvent = {
          type: 'screen-share-stopped',
          roomId,
          peerId,
          producerId,
        };

        socket.to(roomId).emit('screen_share_stopped', screenShareEvent);
        socket.emit('screen_share_stopped', { success: true });
        
        console.log(`Broadcasted screen-share-stopped event to room: ${roomId}`);
        
        logger.info('Screen share stopped and broadcasted', {
          roomId,
          peerId,
          producerId,
        });
      } else {
        console.error(`Failed to stop screen share: ${response.error}`);
        socket.emit('screen_share_error', { error: response.error });
        
        logger.error('Failed to stop screen share', {
          roomId,
          peerId,
          producerId,
          error: response.error,
        });
      }

    } catch (error) {
      console.error('Error handling stop-screen-share:', error);
      logger.error('Error handling stop-screen-share', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit('screen_share_error', {
        error: error instanceof Error ? error.message : 'Failed to stop screen share',
      });
    }
  }

  // 화면 공유 Consumer 생성 처리
  async handleConsumeScreenShare(socket: Socket, data: ConsumeScreenShareData): Promise<void> {
    try {
      console.log(`Received consume-screen-share from socket: ${socket.id}`, data);
      logger.info('Received consume-screen-share event', {
        socketId: socket.id,
        roomId: data.roomId,
        producerId: data.producerId,
      });

      const { roomId, transportId, producerId, rtpCapabilities } = data;

      // 화면 공유 Producer인지 확인
      const activeProducers = this.screenShareService.getActiveScreenShares(roomId);
      const screenShareProducer = activeProducers.find(p => p.id === producerId);
      
      if (!screenShareProducer) {
        console.log(`Screen share producer not found: ${producerId}`);
        socket.emit('screen_share_error', {
          error: 'Screen share producer not found',
        });
        return;
      }

      // 기존 MediaEventsHandler의 consume 로직 활용
      const consumeData = {
        transportId,
        producerId,
        rtpCapabilities,
        roomId,
      };

      await this.mediaEventsHandler.handleConsume(socket, consumeData);

      // 성공 시 화면 공유 repository에 consumer 정보 추가
      const peer = this.roomService.getPeer(socket.id);
      if (peer) {
        const consumer = Array.from(peer.consumers.values()).find(
          c => c.producerId === producerId
        );
        
        if (consumer) {
          this.screenShareService.addConsumerInfo(roomId, {
            id: consumer.id,
            peerId: socket.id,
            roomId,
            producerId,
            producerPeerId: screenShareProducer.peerId,
            kind: 'video',
            rtpParameters: consumer.rtpParameters,
            createdAt: new Date(),
            active: true,
          });

          console.log(`Screen share consumer added to repository: ${consumer.id}`);
        }
      }

    } catch (error) {
      console.error('Error handling consume-screen-share:', error);
      logger.error('Error handling consume-screen-share', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit('screen_share_error', {
        error: error instanceof Error ? error.message : 'Failed to consume screen share',
      });
    }
  }

  // 활성 화면 공유 목록 조회 처리
  handleGetActiveScreenShares(socket: Socket, data: { roomId: string }): void {
    try {
      console.log(`Received get-active-screen-shares from socket: ${socket.id}`, data);
      logger.info('Received get-active-screen-shares event', {
        socketId: socket.id,
        roomId: data.roomId,
      });

      const activeScreenShares = this.screenShareService.getActiveScreenShares(data.roomId);
      
      console.log(`Retrieved ${activeScreenShares.length} active screen shares for room: ${data.roomId}`);
      logger.info('Active screen shares retrieved', {
        roomId: data.roomId,
        count: activeScreenShares.length,
      });

      socket.emit('active_screen_shares', {
        success: true,
        screenShares: activeScreenShares,
      });

    } catch (error) {
      console.error('Error handling get-active-screen-shares:', error);
      logger.error('Error handling get-active-screen-shares', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit('screen_share_error', {
        error: error instanceof Error ? error.message : 'Failed to get active screen shares',
      });
    }
  }

  // 화면 공유 Producer 생성 처리 (기존 로직과 통합)
  private async handleScreenShareProduce(socket: Socket, data: any): Promise<void> {
    try {
      const { transportId, kind, rtpParameters, roomId, appData } = data;
      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(socket.id);

      if (!room || !peer) {
        throw new Error("Room or peer not found");
      }

      const transport = peer.transports.get(transportId);
      if (!transport) {
        throw new Error("Transport not found");
      }

      // mediasoup 워커에 producer를 생성 (화면 공유용 appData 포함)
      const producer = await transport.produce({ 
        kind, 
        rtpParameters,
        appData: appData || { type: 'screenshare' }
      });
      
      peer.producers.set(producer.id, producer);

      logger.info(
        `Screen share producer created: ${producer.id} (${kind}) for ${socket.id}`
      );

      // 화면 공유 repository에 producer 정보 저장
      const producerInfo: ScreenShareProducerInfo = {
        id: producer.id,
        peerId: appData?.peerId || socket.id,
        roomId,
        kind: 'video',
        rtpParameters,
        createdAt: new Date(),
        active: true,
      };

      this.screenShareService.addProducerInfo(roomId, producerInfo);

      // 방에 있는 다른 모든 peer에게 새로 생성된 화면 공유 알림
      const screenShareEvent: ScreenShareEvent = {
        type: 'screen-share-started',
        roomId,
        peerId: appData?.peerId || socket.id,
        producerId: producer.id,
      };

      socket.to(roomId).emit("screen_share_started", screenShareEvent);
      
      // 기존 new_producer 이벤트도 발송 (호환성 유지)
      socket.to(roomId).emit("new_producer", {
        producerId: producer.id,
        producerSocketId: socket.id,
        kind,
        type: 'screenshare',
      });

      // 요청을 보낸 peer에게 성공했음을 알림
      socket.emit("producer_created", { id: producer.id, type: 'screenshare' });

      // 몇명에게 보냈는지 로깅을 위함
      const otherPeers = Array.from(room.peers.keys()).filter(
        (id) => id !== socket.id
      );
      logger.info(
        `Notified ${otherPeers.length} peers about new screen share from ${socket.id}`
      );

    } catch (error) {
      logger.error("Error creating screen share producer:", error);
      socket.emit("screen_share_error", { 
        error: error instanceof Error ? error.message : 'Failed to create screen share producer' 
      });
    }
  }

  // 피어 연결 해제 시 정리
  handlePeerDisconnection(roomId: string, peerId: string): void {
    try {
      console.log(`Handling screen share cleanup for disconnected peer - Room: ${roomId}, Peer: ${peerId}`);
      logger.info('Handling screen share cleanup for disconnected peer', {
        roomId,
        peerId,
      });

      this.screenShareService.cleanupPeer(roomId, peerId);

      console.log(`Screen share cleanup completed for peer: ${peerId}`);
      logger.info('Screen share cleanup completed for peer', {
        roomId,
        peerId,
      });

    } catch (error) {
      console.error('Error handling screen share peer disconnection:', error);
      logger.error('Error handling screen share peer disconnection', {
        roomId,
        peerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 방 정리
  handleRoomCleanup(roomId: string): void {
    try {
      console.log(`Handling screen share cleanup for room: ${roomId}`);
      logger.info('Handling screen share cleanup for room', { roomId });

      this.screenShareService.cleanupRoom(roomId);

      console.log(`Screen share room cleanup completed: ${roomId}`);
      logger.info('Screen share room cleanup completed', { roomId });

    } catch (error) {
      console.error('Error handling screen share room cleanup:', error);
      logger.error('Error handling screen share room cleanup', {
        roomId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}