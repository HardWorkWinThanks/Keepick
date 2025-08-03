import { Request, Response } from "express";
import { roomService } from "../factory/room.factory";
import { logger } from "../../../utils/logger";

/**
 * HTTP API 엔드포인트를 관리
 * HTTP 요청을 받아, 비즈니스 로직을 담당하는 roomService를 호출하고, 결과를 JSON형태로 응답
 */
// TODO: Response 타입 정의 및 코드 분리
class RoomController {

  // GET /rooms/:roomId/rtp_capabilities
  async getRtpCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      // room을 생성 or 반환, mediasoup 라우터의 rtpCapabilities를 제공하기 위한 사전 작업
      const room = await roomService.createRoom(roomId);

      // mediasoup 라우터의 rtpCapabilities를 JSON 응답으로 보냄
      res.json({
        rtpCapabilities: room.router.rtpCapabilities,
      });
    } catch (error) {
      logger.error("Error getting RTP capabilities:", error);
      res.status(500).json({
        error: "Failed to get RTP capabilities",
      });
    }
  }

  // GET /rooms/:roomId (특정 room의 상세정보를 제공)
  async getRoomInfo(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = roomService.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      const roomInfo = {
        id: room.id,
        peersCount: room.peers.size,
        createdAt: room.createdAt,
        peers: Array.from(room.peers.values()).map(peer => ({
          id: peer.id,
          name: peer.name,
          joinedAt: peer.joinedAt,
          producersCount: peer.producers.size,
          consumersCount: peer.consumers.size,
          transportsCount: peer.transports.size,
        })),
      };

      res.json(roomInfo);
    } catch (error) {
      logger.error("Error getting room info:", error);
      res.status(500).json({
        error: "Failed to get room info",
      });
    }
  }

  // GET /rooms
  async getAllRooms(req: Request, res: Response): Promise<void> {
    try {
      const rooms = roomService.getRoomsInfo();
      res.json({ rooms });
    } catch (error) {
      logger.error("Error getting all rooms:", error);
      res.status(500).json({
        error: "Failed to get rooms",
      });
    }
  }

  // DELETE /rooms/:roomId (특정 room을 강제로 삭제하는 관리자용 기능)
  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = roomService.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      // 모든 피어들을 정리하고 룸 삭제
      for (const [peerId] of room.peers) {
        roomService.leaveRoom(peerId);
      }

      res.json({ message: `Room ${roomId} deleted successfully` });
    } catch (error) {
      logger.error("Error deleting room:", error);
      res.status(500).json({
        error: "Failed to delete room",
      });
    }
  }

  // GET /rooms/:roomId/peers/:peerId (특정 room의 특정 peer에 대한 상세 정보)
  async getPeerInfo(req: Request, res: Response): Promise<void> {
    try {
      const { roomId, peerId } = req.params;
      const room = roomService.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      const peer = room.peers.get(peerId);
      if (!peer) {
        res.status(404).json({ error: "Peer not found" });
        return;
      }

      const peerInfo = {
        id: peer.id,
        name: peer.name,
        roomId: peer.roomId,
        joinedAt: peer.joinedAt,
        transports: Array.from(peer.transports.entries()).map(([id, transport]) => ({
          id,
          closed: transport.closed,
          dtlsState: transport.dtlsState,
        })),
        producers: Array.from(peer.producers.entries()).map(([id, producer]) => ({
          id,
          kind: producer.kind,
          paused: producer.paused,
          type: producer.type,
        })),
        consumers: Array.from(peer.consumers.entries()).map(([id, consumer]) => ({
          id,
          kind: consumer.kind,
          paused: consumer.paused,
          type: consumer.type,
          producerId: consumer.producerId,
        })),
      };

      res.json(peerInfo);
    } catch (error) {
      logger.error("Error getting peer info:", error);
      res.status(500).json({
        error: "Failed to get peer info",
      });
    }
  }

  // GET /stats (전체 시스템의 통계 정보를 제공)
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const rooms = roomService.getRoomsInfo();
      
      /**
       * 전체 room수, 전체 peer수, 평균 peer수, 가장 오래된 룸 등
       */
      const stats = {
        totalRooms: rooms.length,
        totalPeers: rooms.reduce((sum, room) => sum + room.peersCount, 0),
        roomsWithPeers: rooms.filter(room => room.peersCount > 0).length,
        emptyRooms: rooms.filter(room => room.peersCount === 0).length,
        averagePeersPerRoom: rooms.length > 0 
          ? (rooms.reduce((sum, room) => sum + room.peersCount, 0) / rooms.length).toFixed(2)
          : 0,
        oldestRoom: rooms.length > 0 
          ? rooms.reduce((oldest, room) => 
              room.createdAt < oldest.createdAt ? room : oldest
            ).createdAt
          : null,
      };

      res.json(stats);
    } catch (error) {
      logger.error("Error getting system stats:", error);
      res.status(500).json({
        error: "Failed to get system stats",
      });
    }
  }
}

export const roomController = new RoomController();