// src/domain/screen-share/controller/screen-share.controller.ts

import { Request, Response } from 'express';
import { ScreenShareService } from '../services/screen-share.service';
import { logger } from '../../../utils/logger';

export class ScreenShareController {
  constructor(
    private screenShareService: ScreenShareService
  ) {}

  // GET /api/screen-share/status/:roomId
  async getScreenShareStatus(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      
      const isActive = this.screenShareService.isScreenShareActive(roomId);
      const activeShare = this.screenShareService.getActiveScreenShare(roomId);

      res.json({
        success: true,
        isActive,
        screenShare: activeShare ? {
          producerId: activeShare.id,
          peerId: activeShare.peerId,
          createdAt: activeShare.createdAt
        } : null
      });
    } catch (error) {
      logger.error('Get screen share status error:', error);
      res.status(500).json({
        success: false,
        error: error
      });
    }
  }

  // POST /api/screen-share/start
  async startScreenShare(req: Request, res: Response): Promise<void> {
    try {
      const { roomId, peerId, rtpParameters } = req.body;

      if (!roomId || !peerId || !rtpParameters) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
        return;
      }

      const result = await this.screenShareService.startScreenShare({
        roomId,
        peerId,
        rtpParameters
      });

      res.json({
        success: true,
        producerId: result.producerId
      });
    } catch (error) {
      logger.error('Start screen share error:', error);
      res.status(500).json({
        success: false,
        error: error
      });
    }
  }

  // POST /api/screen-share/stop
  async stopScreenShare(req: Request, res: Response): Promise<void> {
    try {
      const { roomId, peerId, producerId } = req.body;

      if (!roomId || !peerId || !producerId) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
        return;
      }

      await this.screenShareService.stopScreenShare({
        roomId,
        peerId,
        producerId
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Stop screen share error:', error);
      res.status(500).json({
        success: false,
        error: error
      });
    }
  }

  // POST /api/screen-share/consume
  async consumeScreenShare(req: Request, res: Response): Promise<void> {
    try {
      const { roomId, peerId, producerId, rtpCapabilities } = req.body;

      if (!roomId || !peerId || !producerId || !rtpCapabilities) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
        return;
      }

      const result = await this.screenShareService.consumeScreenShare({
        roomId,
        peerId,
        producerId,
        rtpCapabilities
      });

      res.json({
        success: true,
        params: result.params
      });
    } catch (error) {
      logger.error('Consume screen share error:', error);
      res.status(500).json({
        success: false,
        error: error
      });
    }
  }

  // PUT /api/screen-share/consumer/:consumerId/resume
  async resumeConsumer(req: Request, res: Response): Promise<void> {
    try {
      const { consumerId } = req.params;
      const { peerId } = req.body;

      if (!peerId) {
        res.status(400).json({
          success: false,
          error: 'Missing peerId'
        });
        return;
      }

      await this.screenShareService.resumeConsumer(consumerId, peerId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Resume screen share consumer error:', error);
      res.status(500).json({
        success: false,
        error: error
      });
    }
  }

  // PUT /api/screen-share/consumer/:consumerId/pause
  async pauseConsumer(req: Request, res: Response): Promise<void> {
    try {
      const { consumerId } = req.params;
      const { peerId } = req.body;

      if (!peerId) {
        res.status(400).json({
          success: false,
          error: 'Missing peerId'
        });
        return;
      }

      await this.screenShareService.pauseConsumer(consumerId, peerId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Pause screen share consumer error:', error);
      res.status(500).json({
        success: false,
        error: error
      });
    }
  }
}