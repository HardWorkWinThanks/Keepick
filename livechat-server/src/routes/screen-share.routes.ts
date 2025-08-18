// src/routes/screen-share.routes.ts

import { Router } from 'express';
import { logger } from '../utils/logger';
import { screenShareService } from '../domain/screenshare/factory/screen-share.factory';
import { ScreenShareController } from '../domain/screenshare/controller/screen-share.controller';

export function screenShareRouter(): Router {
  console.log('Creating screen share routes...');
  logger.info('Creating screen share routes');

  const router = Router();
  const screenShareController = new ScreenShareController(screenShareService);

  // 화면 공유 시작
  router.post('/start', screenShareController.startScreenShare);

  // 화면 공유 중지
  router.post('/stop', screenShareController.stopScreenShare);

  // Consumer 생성
  router.post('/create-consumer', screenShareController.createConsumer);

  // 활성 화면 공유 목록 조회
  router.get('/active/:roomId', screenShareController.getActiveScreenShares);

  // 피어 정리
  router.delete('/cleanup/:roomId/:peerId', screenShareController.cleanupPeer);

  // 방 정리
  router.delete('/room/:roomId', screenShareController.cleanupRoom);

  // 디버깅
  router.get('/debug/:roomId', screenShareController.debugRoom);

  // 헬스체크
  router.get('/health', (req, res) => {
    console.log('Screen share health check called');
    logger.info('Screen share health check called', { ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Screen share service is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  console.log('Screen share routes created successfully');
  logger.info('Screen share routes created successfully');

  return router;
}