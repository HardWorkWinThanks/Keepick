import { RoomService } from "../service/room.service";
import { RoomRepository } from "../repository/room.repository";
import { PeerManager } from "../service/peer.manager";

// RoomService를 싱글톤으로 가져오기 위한 팩토리 클래스
class RoomFactory {
  private static instance: RoomService;

  static getInstance(): RoomService {
    if (!this.instance) {
      const roomRepository = new RoomRepository();
      const peerManager = new PeerManager();
      this.instance = new RoomService(roomRepository, peerManager);
    }
    return this.instance;
  }
}

export const roomService = RoomFactory.getInstance();