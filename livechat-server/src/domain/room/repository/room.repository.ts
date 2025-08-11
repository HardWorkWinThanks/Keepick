import { RoomState, Peer } from "../types/room.types";
import { mediasoupService } from "../../media/mediasoup.service";

export class RoomRepository {
  private rooms: Map<string, RoomState> = new Map();

  async createRoom(roomId: string): Promise<RoomState> {
    const router = await mediasoupService.createRouter();
    const room: RoomState = {
      id: roomId,
      router,
      peers: new Map(),
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.router.close();
      this.rooms.delete(roomId);
    }
  }

  getPeer(socketId: string): Peer | undefined {
    for (const room of this.rooms.values()) {
      const peer = room.peers.get(socketId);
      if (peer) return peer;
    }
    return undefined;
  }

  getRoomByPeerId(socketId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.peers.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  getRoomsInfo() {
    return Array.from(this.rooms.entries()).map(([id, room]) => ({
      id,
      peersCount: room.peers.size,
      createdAt: room.createdAt,
    }));
  }

  getAllRooms(): Map<string, RoomState> {
    return this.rooms;
  }
}