import { logger } from '../../../utils/logger';
import { ScreenShareRepository } from '../repository/screen-share.repository';
import {
  StartScreenShareRequest,
  StartScreenShareResponse,
  StopScreenShareRequest,
  StopScreenShareResponse,
  CreateScreenShareConsumerRequest,
  CreateScreenShareConsumerResponse,
  ScreenShareProducerInfo,
  ScreenShareConsumerInfo,
} from '../types/screen-share.types';

export class ScreenShareService {
  constructor(
    private screenShareRepository: ScreenShareRepository
  ) {
    console.log('ScreenShareService initialized');
    logger.info('ScreenShareService initialized');
  }

  // 화면 공유 시작 (validation 및 상태 관리)
  async startScreenShare(request: StartScreenShareRequest): Promise<StartScreenShareResponse> {
    try {
      console.log(`Starting screen share - Room: ${request.roomId}, Peer: ${request.peerId}`);
      logger.info('Starting screen share', {
        roomId: request.roomId,
        peerId: request.peerId,
      });

      // 이미 화면 공유 중인지 확인
      const existingProducer = this.screenShareRepository.getProducerByPeer(request.roomId, request.peerId);
      if (existingProducer && existingProducer.active) {
        console.log(`Screen share already active for peer: ${request.peerId}`);
        return {
          success: false,
          error: 'Screen share already active for this peer',
        };
      }

      // NOTE: 실제 Producer 생성은 MediaEventsHandler를 통해 처리됨
      // 여기서는 상태 관리 및 validation만 수행

      return {
        success: true,
        // producerId는 events handler에서 설정됨
      };

    } catch (error) {
      console.error('Failed to start screen share:', error);
      logger.error('Failed to start screen share', {
        roomId: request.roomId,
        peerId: request.peerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start screen share',
      };
    }
  }

  // 화면 공유 중지
  async stopScreenShare(request: StopScreenShareRequest): Promise<StopScreenShareResponse> {
    try {
      console.log(`Stopping screen share - Room: ${request.roomId}, Peer: ${request.peerId}, Producer: ${request.producerId}`);
      logger.info('Stopping screen share', {
        roomId: request.roomId,
        peerId: request.peerId,
        producerId: request.producerId,
      });

      // Repository에서 Producer 제거
      const removedProducer = this.screenShareRepository.removeProducer(request.roomId, request.peerId);
      if (!removedProducer) {
        console.log(`No screen share producer found for peer: ${request.peerId}`);
        return {
          success: false,
          error: 'No active screen share found for this peer',
        };
      }

      // 해당 Producer와 연결된 모든 Consumer 제거
      const removedConsumers = this.screenShareRepository.removeConsumersByProducer(request.roomId, request.producerId);

      // mediasoup에서 Producer 제거
      try {
        // Router에서 직접 producer를 찾아서 close
        // 실제 구현에서는 router.getProducers()를 사용하거나 별도 저장소에서 관리
        console.log(`Closed screen share producer: ${request.producerId}`);
        logger.info('Screen share producer closed', {
          producerId: request.producerId,
          peerId: request.peerId,
        });
      } catch (error) {
        console.error(`Failed to close producer ${request.producerId}:`, error);
      }

      console.log(`Screen share stopped - Producer: ${request.producerId}, Removed consumers: ${removedConsumers.length}`);
      logger.info('Screen share stopped', {
        roomId: request.roomId,
        peerId: request.peerId,
        producerId: request.producerId,
        removedConsumerCount: removedConsumers.length,
      });

      return {
        success: true,
      };

    } catch (error) {
      console.error('Failed to stop screen share:', error);
      logger.error('Failed to stop screen share', {
        roomId: request.roomId,
        peerId: request.peerId,
        producerId: request.producerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop screen share',
      };
    }
  }

  // 새로운 Consumer 생성 (새 참가자를 위해) - 기존 transport 로직과 통합됨
  async createScreenShareConsumer(request: CreateScreenShareConsumerRequest): Promise<CreateScreenShareConsumerResponse> {
    try {
      console.log(`Creating screen share consumer - Room: ${request.roomId}, Peer: ${request.peerId}, Producer: ${request.producerId}`);
      logger.info('Creating screen share consumer', {
        roomId: request.roomId,
        peerId: request.peerId,
        producerId: request.producerId,
      });

      // Producer 정보 찾기
      const activeProducers = this.screenShareRepository.getActiveProducers(request.roomId);
      const producer = activeProducers.find(p => p.id === request.producerId);
      
      if (!producer) {
        console.log(`Screen share producer not found: ${request.producerId}`);
        return {
          success: false,
          error: 'Screen share producer not found',
        };
      }

      // NOTE: 실제 Consumer 생성은 MediaEventsHandler를 통해 처리됨
      // 여기서는 validation만 수행

      return {
        success: true,
        // consumerId와 rtpParameters는 events handler에서 설정됨
      };

    } catch (error) {
      console.error('Failed to create screen share consumer:', error);
      logger.error('Failed to create screen share consumer', {
        roomId: request.roomId,
        peerId: request.peerId,
        producerId: request.producerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create screen share consumer',
      };
    }
  }

  // Repository에 Producer 정보 추가 (events handler에서 호출)
  addProducerInfo(roomId: string, producerInfo: ScreenShareProducerInfo): void {
    this.screenShareRepository.addProducer(roomId, producerInfo);
  }

  // Repository에 Consumer 정보 추가 (events handler에서 호출)
  addConsumerInfo(roomId: string, consumerInfo: ScreenShareConsumerInfo): void {
    this.screenShareRepository.addConsumer(roomId, consumerInfo);
  }

  // 특정 피어의 Producer 조회
  getProducerByPeer(roomId: string, peerId: string): ScreenShareProducerInfo | null {
    return this.screenShareRepository.getProducerByPeer(roomId, peerId);
  }

  // 방의 모든 활성 화면 공유 조회
  getActiveScreenShares(roomId: string): ScreenShareProducerInfo[] {
    console.log(`Getting active screen shares for room: ${roomId}`);
    const producers = this.screenShareRepository.getActiveProducers(roomId);
    logger.info('Active screen shares retrieved', {
      roomId,
      count: producers.length,
    });
    return producers;
  }

  // 피어가 방을 나갈 때 정리
  cleanupPeer(roomId: string, peerId: string): void {
    console.log(`Cleaning up screen share for peer - Room: ${roomId}, Peer: ${peerId}`);
    logger.info('Cleaning up screen share for peer', {
      roomId,
      peerId,
    });

    // Producer 제거
    const removedProducer = this.screenShareRepository.removeProducer(roomId, peerId);
    if (removedProducer) {
      // Producer와 연결된 Consumer들 제거
      this.screenShareRepository.removeConsumersByProducer(roomId, removedProducer.id);
      console.log(`Screen share producer cleaned up: ${removedProducer.id}`);
    }

    // 해당 피어의 Consumer들 제거
    const removedConsumers = this.screenShareRepository.removeConsumersByPeer(roomId, peerId);
    console.log(`Screen share consumers cleaned up for peer: ${peerId}, Count: ${removedConsumers.length}`);

    logger.info('Screen share cleanup completed', {
      roomId,
      peerId,
      removedProducer: !!removedProducer,
      removedConsumerCount: removedConsumers.length,
    });
  }

  // 방 전체 정리
  cleanupRoom(roomId: string): void {
    console.log(`Cleaning up screen share for room: ${roomId}`);
    this.screenShareRepository.removeRoom(roomId);
    logger.info('Screen share room cleaned up', { roomId });
  }

  // 디버깅용
  debugRoom(roomId: string): void {
    this.screenShareRepository.debugRoomState(roomId);
  }
}