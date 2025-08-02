import express from "express";
import https from "https";
import http from "http"; 
import cors from "cors";

import { serverConfig } from "./server/server.config";
import { ServerManager } from './server/server.manager'
import { SocketManager } from "./socket/socket.manager";
import { logger } from "./utils/logger";

class Application {
  private app: express.Application;
  private serverManager: ServerManager;
  private socketManager: SocketManager;
  private server: https.Server | http.Server | null = null;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.serverManager = new ServerManager(this.app);
    this.server = this.serverManager.server;
    this.socketManager = new SocketManager(this.server);
  }

  private setupMiddleware() {
    this.app.use(cors(serverConfig.cors));
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.get("/", (req, res) => {
      res.send(`
        <h2>MediaSoup SFU Server (${this.server instanceof https.Server ? "HTTPS" : "HTTP"})</h2>
        <p>SFU 서버가 정상적으로 실행 중입니다.</p>
        <p>프로토콜: ${this.server instanceof https.Server ? "HTTPS" : "HTTP"}</p>
        <p>포트: ${serverConfig.port}</p>
      `);
    });
  }

  async start(): Promise<void> {
    try {
      this.serverManager.listen();
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }
  
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      logger.info("Server shutting down...");

      this.socketManager.close();       // Socket.IO 서버 정리
      await this.serverManager.close(); // HTTP/HTTPS 서버 정리

    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      process.exit(1);
    });

    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled Rejection:", err);
      process.exit(1);
    });
  }
}

// 애플리케이션 시작
const app = new Application();
app.start().catch((error) => {
  console.error("💥 Failed to start application:", error);
  process.exit(1);
});