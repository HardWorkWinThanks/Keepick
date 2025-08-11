import { ScreenShareRepository } from '../repository/screen-share.repository';
import { ScreenShareService } from '../services/screen-share.service';

// ScreenShareService를 싱글톤으로 가져오기 위한 팩토리 클래스
class ScreenShareFactory {
  private static instance: ScreenShareService;

  static getInstance(): ScreenShareService {
    if (!this.instance) {
      const screenShareRepository = new ScreenShareRepository();
      this.instance = new ScreenShareService(screenShareRepository);
    }
    return this.instance;
  }
}

export const screenShareService = ScreenShareFactory.getInstance();