// src/domain/screen-share/factory/screen-share.factory.ts

import { ScreenShareService } from '../services/screen-share.service';
import { ScreenShareRepository } from '../repository/screen-share.repository';
import { ScreenShareEventsHandler } from '../services/screen-share-events.handler';
import { ScreenShareController } from '../controller/screen-share.controller';
import { TransportService } from '../../transport/service/transport.service';
import { logger } from '../../../utils/logger';

export class ScreenShareFactory {
  private static instance: ScreenShareFactory;
  
  private screenShareRepository: ScreenShareRepository;
  private screenShareService: ScreenShareService;
  private screenShareEventsHandler: ScreenShareEventsHandler;
  private screenShareController: ScreenShareController;

  private constructor(
    transportService: TransportService,
  ) {
    this.screenShareRepository = new ScreenShareRepository();
    this.screenShareService = new ScreenShareService(
      this.screenShareRepository,
      transportService,
    );
    this.screenShareEventsHandler = new ScreenShareEventsHandler(
      this.screenShareService,
    );
    this.screenShareController = new ScreenShareController(
      this.screenShareService,
    );
  }

  static getInstance(
    transportService: TransportService,
  ): ScreenShareFactory {
    if (!ScreenShareFactory.instance) {
      ScreenShareFactory.instance = new ScreenShareFactory(
        transportService,
      );
    }
    return ScreenShareFactory.instance;
  }

  getScreenShareService(): ScreenShareService {
    return this.screenShareService;
  }

  getScreenShareEventsHandler(): ScreenShareEventsHandler {
    return this.screenShareEventsHandler;
  }

  getScreenShareController(): ScreenShareController {
    return this.screenShareController;
  }

  getScreenShareRepository(): ScreenShareRepository {
    return this.screenShareRepository;
  }
}