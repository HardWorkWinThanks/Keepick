import { Socket } from "socket.io";
import { RoomService } from "../../room/service/room.service";
import { transportService } from "./transport.service";
import { logger } from "../../../utils/logger";
import {
  CreateTransportData,
  ConnectTransportData,
  ProduceData,
  ConsumeData,
} from "../../room/types/room.types";

// mediasoup Transport 객체의 생성, 연결과 관련된 socket 이벤트를 처리
export class TransportEventsHandler {
  constructor(private roomService: RoomService) {}

  // 클라이언트가 미디어 스트림을 보내기 위한 Transport를 생성해달라고 요청했을때
  async handleCreateProducerTransport(socket: Socket, data: CreateTransportData) {
    try {
      const { roomId } = data;
      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(socket.id);

      if (!room || !peer) {
        throw new Error(
          `Room or Peer not found for socket ${socket.id} in room ${roomId}`
        );
      }

      // mediasoup 라우터에 새로운 WebRtcTransport 객체를 생성
      // transport 객체와 클라이언트에 필요한 연결 정보 params를 반환
      const { transport, params } =
        await transportService.createWebRtcTransport(room.router);
      // 상태 업데이트
      peer.transports.set(transport.id, transport);

      logger.info(
        `Created producer transport ${transport.id} for ${socket.id}`
      );
      // transport의 연결 정보를 보냄
      socket.emit("producer_transport_created", params);
    } catch (error) {
      logger.error(
        `Error creating producer transport for ${socket.id}:`,
        error
      );
      socket.emit("error", {
        message: "Failed to create producer transport",
      });
    }
  }

  // 클라이언트가 미디어 스트림을 받기 위한 Transport를 생성해달라고 요청했을때
  async handleCreateConsumerTransport(socket: Socket, data: CreateTransportData) {
    try {
      const { roomId } = data;
      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(socket.id);

      if (!room || !peer) {
        throw new Error(
          `Room or Peer not found for socket ${socket.id} in room ${roomId}`
        );
      }

      // mediasoup 라우터에 새로운 WebRtcTransport 객체를 생성
      // transport 객체와 클라이언트에 필요한 연결 정보 params를 반환
      const { transport, params } =
        await transportService.createWebRtcTransport(room.router);
      peer.transports.set(transport.id, transport);

      logger.info(
        `Created consumer transport ${transport.id} for ${socket.id}`
      );
      // transport의 연결 정보를 보냄
      socket.emit("consumer_transport_created", params);
    } catch (error) {
      logger.error(
        `Error creating consumer transport for ${socket.id}:`,
        error
      );
      socket.emit("error", {
        message: "Failed to create consumer transport",
      });
    }
  }

  // 클라이언트가 생성된 transport를 mediasoup과 연결하겠다고 요청했을때
  async handleConnectTransport(socket: Socket, data: ConnectTransportData) {
    try {
      const { transportId, dtlsParameters } = data;
      const peer = this.roomService.getPeer(socket.id);

      if (!peer) {
        throw new Error("Peer not found");
      }

      const transport = peer.transports.get(transportId);
      if (!transport) {
        throw new Error("Transport not found");
      }

      // mediasoup의 transport 객체와 클라이언트의 WebRtc 연결을 최종적으로 완료
      await transport.connect({ dtlsParameters });
      logger.info(`Transport connected: ${transportId}`);
      // 연결 성공을 알림
      socket.emit("transport_connected", { transportId });
    } catch (error) {
      logger.error("Error connecting transport:", error);
      socket.emit("error", { message: "Failed to connect transport" });
    }
  }
}