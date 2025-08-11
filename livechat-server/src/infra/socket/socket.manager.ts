import { Server as SocketIOServer } from "socket.io";
import http from "http";
import https from "https";
import { serverConfig } from "../server/server.config";
import { setupSocketHandlers } from "./socket.handler";
import { logger } from "../../utils/logger";

export class SocketManager {
  public io: SocketIOServer;

  constructor(server: http.Server | https.Server) {
    this.io = new SocketIOServer(server, {
      cors: serverConfig.cors,
    });
    setupSocketHandlers(this.io);
    logger.info("Socket.IO server configured");
  }

  close(): void {
    this.io.close();
  }
}