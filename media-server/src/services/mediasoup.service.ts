import * as mediasoup from "mediasoup";
import { Worker, Router } from "mediasoup/node/lib/types";
import { mediasoupConfig } from "../config/mediasoup.config";
import { logger } from "../utils/logger";

class MediasoupService {
  private worker: Worker | null = null;

  async createWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    this.worker = await mediasoup.createWorker(mediasoupConfig.worker);

    this.worker.on("died", () => {
      logger.error(
        "MediaSoup worker died, exiting in 2 seconds... [pid:%d]",
        this.worker?.pid
      );
      setTimeout(() => process.exit(1), 2000);
    });

    logger.info("MediaSoup worker created [pid:%d]", this.worker.pid);
    return this.worker;
  }

  async createRouter(): Promise<Router> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    return await this.worker.createRouter({
      mediaCodecs: mediasoupConfig.mediaCodecs,
    });
  }

  getWorker(): Worker | null {
    return this.worker;
  }

  async closeWorker(): Promise<void> {
    if (this.worker) {
      this.worker.close();
      this.worker = null;
    }
  }
}

export const mediasoupService = new MediasoupService();
