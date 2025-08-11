import { ScreenShareSession, ScreenShareProducer, ScreenShareConsumer } from '../types/screen-share.types';

export class ScreenShareRepository {
  private screenShareSessions: Map<string, ScreenShareSession> = new Map(); // roomId -> session
  private producers: Map<string, ScreenShareProducer> = new Map(); // producerId -> producer
  private consumers: Map<string, ScreenShareConsumer> = new Map(); // consumerId -> consumer

  // Session Management
  createSession(roomId: string, producerId: string, peerId: string): ScreenShareSession {
    const session: ScreenShareSession = {
      roomId,
      producerId,
      peerId,
      isActive: true,
      consumers: new Map()
    };
    
    this.screenShareSessions.set(roomId, session);
    return session;
  }

  getSession(roomId: string): ScreenShareSession | undefined {
    return this.screenShareSessions.get(roomId);
  }

  removeSession(roomId: string): void {
    this.screenShareSessions.delete(roomId);
  }

  // Producer Management
  addProducer(producer: ScreenShareProducer): void {
    this.producers.set(producer.id, producer);
  }

  getProducer(producerId: string): ScreenShareProducer | undefined {
    return this.producers.get(producerId);
  }

  removeProducer(producerId: string): void {
    this.producers.delete(producerId);
  }

  getProducerByPeer(peerId: string): ScreenShareProducer | undefined {
    return Array.from(this.producers.values()).find(p => p.peerId === peerId && p.isActive);
  }

  // Consumer Management
  addConsumer(consumer: ScreenShareConsumer): void {
    this.consumers.set(consumer.id, consumer);
    
    const session = this.getSession(consumer.roomId);
    if (session) {
      session.consumers.set(consumer.peerId, consumer);
    }
  }

  getConsumer(consumerId: string): ScreenShareConsumer | undefined {
    return this.consumers.get(consumerId);
  }

  removeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      this.consumers.delete(consumerId);
      
      const session = this.getSession(consumer.roomId);
      if (session) {
        session.consumers.delete(consumer.peerId);
      }
    }
  }

  getConsumersByRoom(roomId: string): ScreenShareConsumer[] {
    return Array.from(this.consumers.values()).filter(c => c.roomId === roomId && c.isActive);
  }

  // Utility methods
  isScreenShareActive(roomId: string): boolean {
    const session = this.getSession(roomId);
    return session?.isActive ?? false;
  }

  getActiveScreenShareProducer(roomId: string): ScreenShareProducer | undefined {
    const session = this.getSession(roomId);
    if (!session) return undefined;
    
    return this.getProducer(session.producerId);
  }

  cleanup(): void {
    this.screenShareSessions.clear();
    this.producers.clear();
    this.consumers.clear();
  }
}