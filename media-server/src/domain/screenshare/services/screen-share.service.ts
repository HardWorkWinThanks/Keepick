import { 
  ScreenShareProducer, 
  ScreenShareConsumer, 
  StartScreenShareRequest, 
  StopScreenShareRequest, 
  ConsumeScreenShareRequest 
} from '../types/screen-share.types';
import { ScreenShareRepository } from '../repository/screen-share.repository';
import { TransportService } from '../../transport/service/transport.service';
import { logger } from "../../../utils/logger";

export class ScreenShareService {
  constructor(
    private screenShareRepository: ScreenShareRepository,
    private transportService: TransportService,
  ) {}

  async startScreenShare(request: StartScreenShareRequest): Promise<{ producerId: string }> {
    try {
      // 기존 화면 공유가 있는지 확인
      if (this.screenShareRepository.isScreenShareActive(request.roomId)) {
        throw new Error('Screen share already active in this room');
      }

      // Producer transport 가져오기
      const producerTransport = this.transportService.getProducerTransport(request.peerId);
      if (!producerTransport) {
        throw new Error('Producer transport not found');
      }

      // Screen share producer 생성
      const producer = await producerTransport.produce({
        kind: 'video',
        rtpParameters: request.rtpParameters,
        appData: {
          type: 'screen-share',
          peerId: request.peerId
        }
      });

      // Producer 정보 저장
      const screenShareProducer: ScreenShareProducer = {
        id: producer.id,
        peerId: request.peerId,
        roomId: request.roomId,
        producer,
        isActive: true,
        createdAt: new Date()
      };

      this.screenShareRepository.addProducer(screenShareProducer);
      this.screenShareRepository.createSession(request.roomId, producer.id, request.peerId);

      // Producer 이벤트 핸들링
      producer.on('transportclose', () => {
        this.handleProducerClose(producer.id);
      });

      producer.on('close', () => {
        this.handleProducerClose(producer.id);
      });

      logger.info(`Screen share started: ${producer.id} by peer ${request.peerId} in room ${request.roomId}`);

      return { producerId: producer.id };
    } catch (error) {
      logger.error('Failed to start screen share:', error);
      throw error;
    }
  }

  async stopScreenShare(request: StopScreenShareRequest): Promise<void> {
    try {
      const producer = this.screenShareRepository.getProducer(request.producerId);
      if (!producer) {
        throw new Error('Screen share producer not found');
      }

      // Producer 종료
      producer.producer.close();

      // 관련 consumers 종료
      const consumers = this.screenShareRepository.getConsumersByRoom(request.roomId);
      for (const consumer of consumers) {
        consumer.consumer.close();
        this.screenShareRepository.removeConsumer(consumer.id);
      }

      // Repository에서 제거
      this.screenShareRepository.removeProducer(request.producerId);
      this.screenShareRepository.removeSession(request.roomId);

      logger.info(`Screen share stopped: ${request.producerId} in room ${request.roomId}`);
    } catch (error) {
      logger.error('Failed to stop screen share:', error);
      throw error;
    }
  }

  async consumeScreenShare(request: ConsumeScreenShareRequest): Promise<{ consumer: any, params: any }> {
    try {
      const producer = this.screenShareRepository.getProducer(request.producerId);
      if (!producer || !producer.isActive) {
        throw new Error('Screen share producer not found or inactive');
      }

      // Consumer transport 가져오기
      const consumerTransport = this.transportService.getConsumerTransport(request.peerId);
      if (!consumerTransport) {
        throw new Error('Consumer transport not found');
      }

      // Consumer 생성
      const consumer = await consumerTransport.consume({
        producerId: request.producerId,
        rtpCapabilities: request.rtpCapabilities,
        paused: true,
        appData: {
          type: 'screen-share',
          peerId: request.peerId,
          producerId: request.producerId
        }
      });

      // Consumer 정보 저장
      const screenShareConsumer: ScreenShareConsumer = {
        id: consumer.id,
        peerId: request.peerId,
        roomId: request.roomId,
        producerId: request.producerId,
        consumer,
        isActive: true,
        createdAt: new Date()
      };

      this.screenShareRepository.addConsumer(screenShareConsumer);

      // Consumer 이벤트 핸들링
      consumer.on('transportclose', () => {
        this.screenShareRepository.removeConsumer(consumer.id);
      });

      consumer.on('producerclose', () => {
        this.screenShareRepository.removeConsumer(consumer.id);
      });

      const params = {
        producerId: request.producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused
      };

      logger.info(`Screen share consumer created: ${consumer.id} for peer ${request.peerId}`);

      return { consumer, params };
    } catch (error) {
      logger.error('Failed to consume screen share:', error);
      throw error;
    }
  }

  async resumeConsumer(consumerId: string, peerId: string): Promise<void> {
    try {
      const consumer = this.screenShareRepository.getConsumer(consumerId);
      if (!consumer || consumer.peerId !== peerId) {
        throw new Error('Consumer not found or unauthorized');
      }

      await consumer.consumer.resume();
      logger.info(`Screen share consumer resumed: ${consumerId}`);
    } catch (error) {
      logger.error('Failed to resume screen share consumer:', error);
      throw error;
    }
  }

  async pauseConsumer(consumerId: string, peerId: string): Promise<void> {
    try {
      const consumer = this.screenShareRepository.getConsumer(consumerId);
      if (!consumer || consumer.peerId !== peerId) {
        throw new Error('Consumer not found or unauthorized');
      }

      await consumer.consumer.pause();
      logger.info(`Screen share consumer paused: ${consumerId}`);
    } catch (error) {
      logger.error('Failed to pause screen share consumer:', error);
      throw error;
    }
  }

  getActiveScreenShare(roomId: string): ScreenShareProducer | undefined {
    return this.screenShareRepository.getActiveScreenShareProducer(roomId);
  }

  isScreenShareActive(roomId: string): boolean {
    return this.screenShareRepository.isScreenShareActive(roomId);
  }

  private handleProducerClose(producerId: string): void {
    const producer = this.screenShareRepository.getProducer(producerId);
    if (producer) {
      // 관련 consumers 종료
      const consumers = this.screenShareRepository.getConsumersByRoom(producer.roomId);
      for (const consumer of consumers) {
        if (consumer.producerId === producerId) {
          consumer.consumer.close();
          this.screenShareRepository.removeConsumer(consumer.id);
        }
      }

      // Session 제거
      this.screenShareRepository.removeSession(producer.roomId);
      this.screenShareRepository.removeProducer(producerId);
      
      logger.info(`Screen share producer closed: ${producerId}`);
    }
  }
}