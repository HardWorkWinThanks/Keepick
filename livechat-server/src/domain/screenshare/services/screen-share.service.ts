// src/domain/screenshare/services/screen-share.service.ts
import { RoomService } from "../../room/service/room.service";
import { getProducerAppData } from "../../../shared/types/media.type";

export class ScreenShareService {
  // 이제 RoomService에 의존합니다.
  constructor(private roomService: RoomService) {}

  /**
   * 특정 방에서 이미 화면 공유가 진행 중인지 확인합니다.
   * @param roomId 확인할 방의 ID
   * @returns 공유 중이면 true, 아니면 false
   */
  public isScreenSharingActiveIn(roomId: string): boolean {
    const room = this.roomService.getRoom(roomId);
    if (!room) return false;

    for (const peer of room.peers.values()) {
      for (const producer of peer.producers.values()) {
        const appData = getProducerAppData(producer);
        if (appData?.type === "screen") {
          return true; // 화면 공유 Producer를 찾으면 즉시 true 반환
        }
      }
    }
    return false;
  }
}
