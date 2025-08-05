import http from "http";
import https from "https";
import express from "express";
import fs from "fs";
import { serverConfig } from "./server.config";
import { logger } from "../../utils/logger";

export class ServerManager {
  public server: http.Server | https.Server;

  constructor(app: express.Application) {
    if (serverConfig.ssl) {
      const httpsOptions = {
        key: fs.readFileSync(serverConfig.ssl.keyPath),
        cert: fs.readFileSync(serverConfig.ssl.certPath),
      };
      this.server = https.createServer(httpsOptions, app);
      // this.server = http.createServer(app);
      logger.info("HTTPS server created successfully.");
    } else {
      this.server = http.createServer(app);
      logger.info("HTTP server created successfully.");
    }
  }

  listen(): void {
    const port = Number(serverConfig.port);
    const host = serverConfig.host;
    this.server.listen(port, host, () => {
      logger.info(" ================================");
      logger.info(`  Real Time Server Started (${this.server instanceof https.Server ? "HTTPS" : "HTTP"})`);
      logger.info(`  Port: ${port}`);
      logger.info(`  Host: ${host}`);
      logger.info(`  URL: ${this.server instanceof https.Server ? "https" : "http"}://${host}:${port}`);
      logger.info(" ================================");
    });
  }
  
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}