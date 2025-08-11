import { logger } from '../../../utils/logger';
import { 
  ScreenShareState, 
  ScreenShareProducerInfo, 
  ScreenShareConsumerInfo 
} from '../types/screen-share.types';

export class ScreenShareRepository {
  private screenShares: Map<string, ScreenShareState> = new Map(); // roomId -> ScreenShareState

  constructor() {
    console.log('ScreenShareRepository initialized');
    logger.info('ScreenShareRepository initialized');
  }

  // 방별 화면 공유 상태 초기화
  initializeRoom(roomId: string): void {
    if (!this.screenShares.has(roomId)) {
      const state: ScreenShareState = {
        roomId,
        activeProducers: new Map(),
        consumers: new Map(),
      };
      this.screenShares.set(roomId, state);
      console.log(`Screen share state initialized for room: ${roomId}`);
      logger.info(`Screen share state initialized for room: ${roomId}`);
    }
  }

  // Producer 추가
  addProducer(roomId: string, producerInfo: ScreenShareProducerInfo): void {
    this.initializeRoom(roomId);
    const state = this.screenShares.get(roomId)!;
    state.activeProducers.set(producerInfo.peerId, producerInfo);
    
    console.log(`Screen share producer added - Room: ${roomId}, Peer: ${producerInfo.peerId}, Producer: ${producerInfo.id}`);
    logger.info(`Screen share producer added`, {
      roomId,
      peerId: producerInfo.peerId,
      producerId: producerInfo.id,
    });
  }

  // Producer 제거
  removeProducer(roomId: string, peerId: string): ScreenShareProducerInfo | null {
    const state = this.screenShares.get(roomId);
    if (!state) return null;

    const producerInfo = state.activeProducers.get(peerId);
    if (producerInfo) {
      state.activeProducers.delete(peerId);
      console.log(`Screen share producer removed - Room: ${roomId}, Peer: ${peerId}, Producer: ${producerInfo.id}`);
      logger.info(`Screen share producer removed`, {
        roomId,
        peerId,
        producerId: producerInfo.id,
      });
      return producerInfo;
    }
    return null;
  }

  // 특정 방의 모든 활성 Producer 조회
  getActiveProducers(roomId: string): ScreenShareProducerInfo[] {
    const state = this.screenShares.get(roomId);
    if (!state) return [];
    
    return Array.from(state.activeProducers.values()).filter(p => p.active);
  }

  // 특정 피어의 Producer 조회
  getProducerByPeer(roomId: string, peerId: string): ScreenShareProducerInfo | null {
    const state = this.screenShares.get(roomId);
    if (!state) return null;
    
    return state.activeProducers.get(peerId) || null;
  }

  // Consumer 추가
  addConsumer(roomId: string, consumerInfo: ScreenShareConsumerInfo): void {
    this.initializeRoom(roomId);
    const state = this.screenShares.get(roomId)!;
    
    if (!state.consumers.has(consumerInfo.peerId)) {
      state.consumers.set(consumerInfo.peerId, []);
    }
    
    const peerConsumers = state.consumers.get(consumerInfo.peerId)!;
    peerConsumers.push(consumerInfo);
    
    console.log(`Screen share consumer added - Room: ${roomId}, Peer: ${consumerInfo.peerId}, Consumer: ${consumerInfo.id}`);
    logger.info(`Screen share consumer added`, {
      roomId,
      peerId: consumerInfo.peerId,
      consumerId: consumerInfo.id,
      producerId: consumerInfo.producerId,
    });
  }

  // 특정 피어의 모든 Consumer 제거
  removeConsumersByPeer(roomId: string, peerId: string): ScreenShareConsumerInfo[] {
    const state = this.screenShares.get(roomId);
    if (!state) return [];

    const consumers = state.consumers.get(peerId) || [];
    state.consumers.delete(peerId);
    
    console.log(`Screen share consumers removed for peer - Room: ${roomId}, Peer: ${peerId}, Count: ${consumers.length}`);
    logger.info(`Screen share consumers removed for peer`, {
      roomId,
      peerId,
      consumerCount: consumers.length,
    });
    
    return consumers;
  }

  // 특정 Producer와 연결된 모든 Consumer 제거
  removeConsumersByProducer(roomId: string, producerId: string): ScreenShareConsumerInfo[] {
    const state = this.screenShares.get(roomId);
    if (!state) return [];

    const removedConsumers: ScreenShareConsumerInfo[] = [];
    
    for (const [peerId, consumers] of state.consumers.entries()) {
      const remainingConsumers = consumers.filter(c => {
        if (c.producerId === producerId) {
          removedConsumers.push(c);
          return false;
        }
        return true;
      });
      
      if (remainingConsumers.length === 0) {
        state.consumers.delete(peerId);
      } else {
        state.consumers.set(peerId, remainingConsumers);
      }
    }
    
    console.log(`Screen share consumers removed for producer - Room: ${roomId}, Producer: ${producerId}, Count: ${removedConsumers.length}`);
    logger.info(`Screen share consumers removed for producer`, {
      roomId,
      producerId,
      consumerCount: removedConsumers.length,
    });
    
    return removedConsumers;
  }

  // 특정 방의 모든 Consumer 조회
  getAllConsumers(roomId: string): ScreenShareConsumerInfo[] {
    const state = this.screenShares.get(roomId);
    if (!state) return [];
    
    const allConsumers: ScreenShareConsumerInfo[] = [];
    for (const consumers of state.consumers.values()) {
      allConsumers.push(...consumers);
    }
    
    return allConsumers.filter(c => c.active);
  }

  // 방 전체 삭제
  removeRoom(roomId: string): void {
    if (this.screenShares.has(roomId)) {
      this.screenShares.delete(roomId);
      console.log(`Screen share room removed: ${roomId}`);
      logger.info(`Screen share room removed: ${roomId}`);
    }
  }

  // 디버깅용 - 현재 상태 출력
  debugRoomState(roomId: string): void {
    const state = this.screenShares.get(roomId);
    if (!state) {
      console.log(`No screen share state found for room: ${roomId}`);
      return;
    }

    console.log(`=== Screen Share State for Room: ${roomId} ===`);
    console.log(`Active Producers: ${state.activeProducers.size}`);
    state.activeProducers.forEach((producer, peerId) => {
      console.log(`  - Peer: ${peerId}, Producer: ${producer.id}, Active: ${producer.active}`);
    });
    
    console.log(`Consumers: ${state.consumers.size} peers`);
    state.consumers.forEach((consumers, peerId) => {
      console.log(`  - Peer: ${peerId}, Consumer Count: ${consumers.length}`);
      consumers.forEach(consumer => {
        console.log(`    - Consumer: ${consumer.id}, Producer: ${consumer.producerId}, Active: ${consumer.active}`);
      });
    });
    console.log('=== End Screen Share State ===');
  }
}