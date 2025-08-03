// handlers/socket.handler.ts
import { Server, Socket } from "socket.io";
import { roomService } from "../../domain/room/factory/room.factory";
import { RoomEventsHandler } from "../../domain/room/service/room-events.handler";
import { TransportEventsHandler } from "../../domain/transport/service/transport-events.handler";
import { MediaEventsHandler } from "../../domain/media/media-events.handler";
import {
  CreateTransportData,
  ConnectTransportData,
  ProduceData,
  ConsumeData,
  JoinRoomData,
} from "../../domain/room/types/room.types";

export function setupSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    // 핸들러들 인스턴스 생성
    const roomEventsHandler = new RoomEventsHandler(roomService);
    const transportEventsHandler = new TransportEventsHandler(roomService);
    const mediaEventsHandler = new MediaEventsHandler(roomService, roomEventsHandler);

    // Room 관련 이벤트
    socket.on("join_room", async (data: JoinRoomData) => {
      await roomEventsHandler.handleJoinRoom(socket, data);
    });

    socket.on("leave_room", () => {
      roomEventsHandler.handleLeaveRoom(socket);
    });

    socket.on("get_room_info", (data: { roomId: string }) => {
      roomEventsHandler.handleGetRoomInfo(socket, data);
    });

    // Transport 관련 이벤트
    socket.on("create_producer_transport", async (data: CreateTransportData) => {
      await transportEventsHandler.handleCreateProducerTransport(socket, data);
    });

    socket.on("create_consumer_transport", async (data: CreateTransportData) => {
      await transportEventsHandler.handleCreateConsumerTransport(socket, data);
    });

    socket.on("connect_transport", async (data: ConnectTransportData) => {
      await transportEventsHandler.handleConnectTransport(socket, data);
    });

    // Media 관련 이벤트
    socket.on("produce", async (data: ProduceData) => {
      await mediaEventsHandler.handleProduce(socket, data);
    });

    socket.on("consume", async (data: ConsumeData) => {
      await mediaEventsHandler.handleConsume(socket, data);
    });

    socket.on("resume_consumer", async (data: { consumerId: string }) => {
      await mediaEventsHandler.handleResumeConsumer(socket, data);
    });

    // 연결 해제
    socket.on("disconnect", () => {
      roomEventsHandler.handleDisconnect(socket);
    });
  });
}