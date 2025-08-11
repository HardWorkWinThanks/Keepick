// src/domain/screenshare/controller/screen-share.controller.ts

import { Request, Response } from 'express';
import { logger } from '../../../utils/logger';
import { ScreenShareService } from '../services/screen-share.service';
import {
  StartScreenShareRequest,
  StopScreenShareRequest,
  CreateScreenShareConsumerRequest,
} from '../types/screen-share.types';

export class ScreenShareController {
  constructor(private screenShareService: ScreenShareService) {
    console.log('ScreenShareController initialized');
    logger.info('ScreenShareController initialized');
  }

  // POST /api/screen-share/start
  startScreenShare = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('POST /api/screen-share/start called', req.body);
      logger.info('Screen share start API called', {
        body: req.body,
        ip: req.ip,
      });

      const { roomId, peerId, rtpCapabilities, rtpParameters } = req.body;

      // 입력 검증
      if (!roomId || !peerId || !rtpCapabilities || !rtpParameters) {
        console.log('Invalid request: missing required fields');
        res.status(400).json({
          success: false,
          error: 'Missing required fields: roomId, peerId, rtpCapabilities, rtpParameters',
        });
        return;
      }

      const request: StartScreenShareRequest = {
        roomId,
        peerId,
        rtpCapabilities,
        rtpParameters,
      };

      const response = await this.screenShareService.startScreenShare(request);

      if (response.success) {
        console.log(`Screen share started via API - Producer: ${response.producerId}`);
        logger.info('Screen share started via API', {
          roomId,
          peerId,
          producerId: response.producerId,
        });

        res.status(200).json(response);
      } else {
        console.log(`Screen share start failed via API: ${response.error}`);
        logger.warn('Screen share start failed via API', {
          roomId,
          peerId,
          error: response.error,
        });

        res.status(400).json(response);
      }

    } catch (error) {
      console.error('Error in startScreenShare API:', error);
      logger.error('Error in startScreenShare API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // POST /api/screen-share/stop
  stopScreenShare = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('POST /api/screen-share/stop called', req.body);
      logger.info('Screen share stop API called', {
        body: req.body,
        ip: req.ip,
      });

      const { roomId, peerId, producerId } = req.body;

      // 입력 검증
      if (!roomId || !peerId || !producerId) {
        console.log('Invalid request: missing required fields');
        res.status(400).json({
          success: false,
          error: 'Missing required fields: roomId, peerId, producerId',
        });
        return;
      }

      const request: StopScreenShareRequest = {
        roomId,
        peerId,
        producerId,
      };

      const response = await this.screenShareService.stopScreenShare(request);

      if (response.success) {
        console.log(`Screen share stopped via API`);
        logger.info('Screen share stopped via API', {
          roomId,
          peerId,
          producerId,
        });

        res.status(200).json(response);
      } else {
        console.log(`Screen share stop failed via API: ${response.error}`);
        logger.warn('Screen share stop failed via API', {
          roomId,
          peerId,
          producerId,
          error: response.error,
        });

        res.status(400).json(response);
      }

    } catch (error) {
      console.error('Error in stopScreenShare API:', error);
      logger.error('Error in stopScreenShare API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // POST /api/screen-share/create-consumer
  createConsumer = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('POST /api/screen-share/create-consumer called', req.body);
      logger.info('Screen share create consumer API called', {
        body: req.body,
        ip: req.ip,
      });

      const { roomId, peerId, producerId, rtpCapabilities } = req.body;

      // 입력 검증
      if (!roomId || !peerId || !producerId || !rtpCapabilities) {
        console.log('Invalid request: missing required fields');
        res.status(400).json({
          success: false,
          error: 'Missing required fields: roomId, peerId, producerId, rtpCapabilities',
        });
        return;
      }

      const request: CreateScreenShareConsumerRequest = {
        roomId,
        peerId,
        producerId,
        rtpCapabilities,
      };

      const response = await this.screenShareService.createScreenShareConsumer(request);

      if (response.success) {
        console.log(`Screen share consumer created via API - Consumer: ${response.consumerId}`);
        logger.info('Screen share consumer created via API', {
          roomId,
          peerId,
          producerId,
          consumerId: response.consumerId,
        });

        res.status(200).json(response);
      } else {
        console.log(`Screen share consumer creation failed via API: ${response.error}`);
        logger.warn('Screen share consumer creation failed via API', {
          roomId,
          peerId,
          producerId,
          error: response.error,
        });

        res.status(400).json(response);
      }

    } catch (error) {
      console.error('Error in createConsumer API:', error);
      logger.error('Error in createConsumer API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // GET /api/screen-share/active/:roomId
  getActiveScreenShares = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      console.log(`GET /api/screen-share/active/${roomId} called`);
      logger.info('Get active screen shares API called', {
        roomId,
        ip: req.ip,
      });

      if (!roomId) {
        console.log('Invalid request: missing roomId parameter');
        res.status(400).json({
          success: false,
          error: 'Missing roomId parameter',
        });
        return;
      }

      const activeScreenShares = this.screenShareService.getActiveScreenShares(roomId);

      console.log(`Retrieved ${activeScreenShares.length} active screen shares for room: ${roomId}`);
      logger.info('Active screen shares retrieved via API', {
        roomId,
        count: activeScreenShares.length,
      });

      res.status(200).json({
        success: true,
        screenShares: activeScreenShares,
        count: activeScreenShares.length,
      });

    } catch (error) {
      console.error('Error in getActiveScreenShares API:', error);
      logger.error('Error in getActiveScreenShares API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // DELETE /api/screen-share/cleanup/:roomId/:peerId
  cleanupPeer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId, peerId } = req.params;
      console.log(`DELETE /api/screen-share/cleanup/${roomId}/${peerId} called`);
      logger.info('Screen share cleanup peer API called', {
        roomId,
        peerId,
        ip: req.ip,
      });

      if (!roomId || !peerId) {
        console.log('Invalid request: missing roomId or peerId parameter');
        res.status(400).json({
          success: false,
          error: 'Missing roomId or peerId parameter',
        });
        return;
      }

      this.screenShareService.cleanupPeer(roomId, peerId);

      console.log(`Screen share cleanup completed for peer: ${peerId} in room: ${roomId}`);
      logger.info('Screen share cleanup completed via API', {
        roomId,
        peerId,
      });

      res.status(200).json({
        success: true,
        message: 'Peer cleanup completed',
      });

    } catch (error) {
      console.error('Error in cleanupPeer API:', error);
      logger.error('Error in cleanupPeer API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // DELETE /api/screen-share/room/:roomId
  cleanupRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      console.log(`DELETE /api/screen-share/room/${roomId} called`);
      logger.info('Screen share cleanup room API called', {
        roomId,
        ip: req.ip,
      });

      if (!roomId) {
        console.log('Invalid request: missing roomId parameter');
        res.status(400).json({
          success: false,
          error: 'Missing roomId parameter',
        });
        return;
      }

      this.screenShareService.cleanupRoom(roomId);

      console.log(`Screen share room cleanup completed: ${roomId}`);
      logger.info('Screen share room cleanup completed via API', {
        roomId,
      });

      res.status(200).json({
        success: true,
        message: 'Room cleanup completed',
      });

    } catch (error) {
      console.error('Error in cleanupRoom API:', error);
      logger.error('Error in cleanupRoom API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // GET /api/screen-share/debug/:roomId
  debugRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      console.log(`GET /api/screen-share/debug/${roomId} called`);
      logger.info('Screen share debug API called', {
        roomId,
        ip: req.ip,
      });

      if (!roomId) {
        console.log('Invalid request: missing roomId parameter');
        res.status(400).json({
          success: false,
          error: 'Missing roomId parameter',
        });
        return;
      }

      this.screenShareService.debugRoom(roomId);

      res.status(200).json({
        success: true,
        message: 'Debug information logged to console',
      });

    } catch (error) {
      console.error('Error in debugRoom API:', error);
      logger.error('Error in debugRoom API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}