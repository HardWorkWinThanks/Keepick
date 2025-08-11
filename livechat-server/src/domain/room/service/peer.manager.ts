import { RoomState, Peer } from "../types/room.types";
import { Socket } from "socket.io";

export class PeerManager {
  createPeer(socket: Socket, userName: string, roomId: string): Peer {
    return {
      id: socket.id,
      name: userName,
      socket,
      roomId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
      joinedAt: new Date(),
    };
  }

  getProducersForPeer(room: RoomState, socketId: string) {
    const existingProducers: any[] = [];
    
    for (const [peerId, existingPeer] of room.peers.entries()) {
      if (peerId !== socketId) {
        // 자신을 제외
        for (const [producerId, producer] of existingPeer.producers.entries()) {
          existingProducers.push({
            producerId,
            producerSocketId: peerId,
            kind: producer.kind,
          });
        }
      }
    }
    
    return existingProducers;
  }

  cleanupPeer(peer: Peer): void {
    // Producer 정리
    for (const producer of peer.producers.values()) {
      producer.close();
    }

    // Consumer 정리
    for (const consumer of peer.consumers.values()) {
      consumer.close();
    }

    // Transport 정리
    for (const transport of peer.transports.values()) {
      transport.close();
    }
  }
}