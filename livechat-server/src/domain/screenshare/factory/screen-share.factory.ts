// src/domain/screenshare/factory/screen-share.factory.ts
import { ScreenShareService } from "../services/screen-share.service";
import { roomService } from "../../room/factory/room.factory"; // RoomService를 가져옵니다.

class ScreenShareFactory {
  private static instance: ScreenShareService;

  static getInstance(): ScreenShareService {
    if (!this.instance) {
      // RoomService를 주입하여 생성합니다.
      this.instance = new ScreenShareService(roomService);
    }
    return this.instance;
  }
}

export const screenShareService = ScreenShareFactory.getInstance();
