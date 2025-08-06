import { Socket } from "socket.io";
import { RoomService } from "./room.service";
import { logger } from "../../../utils/logger";
import { JoinRoomData } from "../types/room.types";

export class RoomEventsHandler {
  private pendingConsumerRequests = new Map<string, Set<string>>();

  constructor(private roomService: RoomService) {}

  async handleJoinRoom(socket: Socket, data: JoinRoomData) {
    try {
      const { roomId, userName } = data;
      logger.info(
        `Join room request for room: ${roomId} from ${socket.id} as "${userName}"`
      );

      // 먼저 기존 연결이 있다면 정리 (중복 방지)
      const existingRoom = this.roomService.getRoomByPeerId(socket.id);
      if (existingRoom) {
        logger.info(`Cleaning up existing connection for ${socket.id}`);
        this.roomService.leaveRoom(socket.id);
      }

      const peer = await this.roomService.joinRoom(roomId, socket, userName);
      const room = this.roomService.getRoom(roomId)!;

      // 방에 있는 다른 사용자
      const peersWithProducers = Array.from(room.peers.values())
        .filter((p) => p.id !== socket.id)
        .map((existingPeer) => ({
          id: existingPeer.id,
          name: existingPeer.name,
          producers: Array.from(existingPeer.producers.values()).map(
            (producer) => ({
              producerId: producer.id,
              kind: producer.kind,
            })
          ),
        }));

      // 입장한 클라이언트에게 joined_room 이벤트로 rtp와 다른 모든 peer정보를 보냄
      socket.emit("joined_room", {
        rtpCapabilities: room.router.rtpCapabilities,
        peers: peersWithProducers,
      });

      // 방에있는 다른 사용자에게 새로 입장한 사용자의 정보를 알림
      socket.to(roomId).emit("user_joined", {
        id: socket.id,
        name: peer.name,
      });

      logger.info(`Sent initial data to ${socket.id}`);
      return peer;
    } catch (error) {
      logger.error(`Error on join_room for ${socket.id}:`, error);
      socket.emit("error", { message: "Failed to join room" });
    }
  }

  handleLeaveRoom(socket: Socket) {
    try {
      logger.info(`Explicit leave room request from ${socket.id}`);
      const room = this.roomService.getRoomByPeerId(socket.id);

      if (room) {
        const peer = room.peers.get(socket.id);

        // Producer 닫힘 알림
        if (peer) {
          peer.producers.forEach((producer) => {
            socket.to(room.id).emit("producer_closed", {
              producerId: producer.id,
              producerSocketId: socket.id,
            });
          });
        }

        // 사용자 나감 알림
        socket.to(room.id).emit("user_left", {
          id: socket.id,
        });

        logger.info(`Notified peers about ${socket.id} leaving`);
      }

      // 서버 측 리소스 정리
      this.roomService.leaveRoom(socket.id);

      // 클라이언트에 확인 응답
      socket.emit("left_room");
      logger.info(`${socket.id} successfully left room`);
    } catch (error) {
      logger.error(`Error on leave_room for ${socket.id}:`, error);
      socket.emit("error", { message: "Failed to leave room" });
    }
  }

  // 예기치 않은 연결 종료 (Socket.IO에 의해 자동 호출)
  // 다른 참여자들에게는 종료를 알리지만, 해당 사용자에게는 left_room을 전송하지 않음
  handleDisconnect(socket: Socket) {
    logger.info(`Socket disconnected: ${socket.id}`);

    // pending 요청 정리
    this.pendingConsumerRequests.delete(socket.id);

    const room = this.roomService.getRoomByPeerId(socket.id);

    if (room) {
      const peer = room.peers.get(socket.id);

      if (peer) {
        peer.producers.forEach((producer) => {
          socket.to(room.id).emit("producer_closed", {
            producerId: producer.id,
            producerSocketId: socket.id,
          });
        });
      }

      socket.to(room.id).emit("user_left", {
        id: socket.id,
      });

      logger.info(
        `Notified peers in room ${room.id} about ${socket.id} leaving`
      );
    }

    this.roomService.leaveRoom(socket.id);
  }

  // 특정 방의 상세 정보를 클라이언트가 요청했을때
  handleGetRoomInfo(socket: Socket, data: { roomId: string }) {
    try {
      const { roomId } = data;
      const room = this.roomService.getRoom(roomId);

      if (!room) {
        socket.emit("room_info", { error: "Room not found" });
        return;
      }

      const roomInfo = {
        roomId,
        peersCount: room.peers.size,
        peers: Array.from(room.peers.entries()).map(([peerId, peer]) => ({
          id: peerId,
          producersCount: peer.producers.size,
          consumersCount: peer.consumers.size,
          transportsCount: peer.transports.size,
          producers: Array.from(peer.producers.entries()).map(
            ([id, producer]) => ({
              id,
              kind: producer.kind,
              paused: producer.paused,
            })
          ),
        })),
      };

      socket.emit("room_info", roomInfo);
      logger.info(`Room info sent to ${socket.id}:`, roomInfo);
    } catch (error) {
      logger.error("Error getting room info:", error);
      socket.emit("room_info", { error: "Failed to get room info" });
    }
  }

  // Consumer 요청 중복 방지를 위한 헬퍼 메서드
  addPendingConsumerRequest(socketId: string, producerId: string): boolean {
    if (!this.pendingConsumerRequests.has(socketId)) {
      this.pendingConsumerRequests.set(socketId, new Set());
    }

    const socketRequests = this.pendingConsumerRequests.get(socketId)!;
    if (socketRequests.has(producerId)) {
      logger.warn(
        `Consumer request already pending for producer ${producerId} from ${socketId}`
      );
      return false;
    }

    socketRequests.add(producerId);
    return true;
  }

  removePendingConsumerRequest(socketId: string, producerId: string): void {
    const socketRequests = this.pendingConsumerRequests.get(socketId);
    if (socketRequests) {
      socketRequests.delete(producerId);
    }
  }
}