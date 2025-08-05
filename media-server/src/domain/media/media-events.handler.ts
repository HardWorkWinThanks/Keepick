import { Socket } from "socket.io";
import { RoomService } from "../room/service/room.service";
import { RoomEventsHandler } from "../room/service/room-events.handler";
import { logger } from "../../utils/logger";
import { ProduceData, ConsumeData } from "../room/types/room.types";

export class MediaEventsHandler {
  constructor(
    private roomService: RoomService,
    private roomEventsHandler: RoomEventsHandler
  ) {}

  async handleProduce(socket: Socket, data: ProduceData) {
    try {
      const { transportId, kind, rtpParameters, roomId } = data;
      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(socket.id);

      if (!room || !peer) {
        throw new Error("Room or peer not found");
      }

      const transport = peer.transports.get(transportId);
      if (!transport) {
        throw new Error("Transport not found");
      }

      // mediasoup 워커에 producer를 생성
      const producer = await transport.produce({ kind, rtpParameters });
      peer.producers.set(producer.id, producer);

      logger.info(
        `Producer created: ${producer.id} (${kind}) for ${socket.id}`
      );

      // 방에 있는 다른 모든 peer에게 새로 생성된 producer의 ID를 알림
      socket.to(roomId).emit("new_producer", {
        producerId: producer.id,
        producerSocketId: socket.id,
        kind,
      });

      // 요청을 보낸 peer에게 성공했음을 알림
      socket.emit("producer_created", { id: producer.id });

      // 몇명에게 보냈는지 로깅을 위함
      const otherPeers = Array.from(room.peers.keys()).filter(
        (id) => id !== socket.id
      );
      logger.info(
        `Notified ${otherPeers.length} peers about new ${kind} producer from ${socket.id}`
      );
    } catch (error) {
      logger.error("Error creating producer:", error);
      socket.emit("error", { message: "Failed to create producer" });
    }
  }

  async handleConsume(socket: Socket, data: ConsumeData) {
    try {
      const { transportId, producerId, rtpCapabilities, roomId } = data;

      // 동일한 소비 요청이 여러번 들어오는 것을 방지
      if (!this.roomEventsHandler.addPendingConsumerRequest(socket.id, producerId)) {
        return;
      }

      const room = this.roomService.getRoom(roomId);
      const peer = room?.peers.get(socket.id);

      if (!room || !peer) {
        this.roomEventsHandler.removePendingConsumerRequest(socket.id, producerId);
        throw new Error("Room or peer not found");
      }

      const transport = peer.transports.get(transportId);
      if (!transport) {
        this.roomEventsHandler.removePendingConsumerRequest(socket.id, producerId);
        throw new Error("Transport not found");
      }

      // Producer 찾기
      let producer;
      for (const [, otherPeer] of room.peers.entries()) {
        producer = otherPeer.producers.get(producerId);
        if (producer) {
          break;
        }
      }

      if (!producer) {
        this.roomEventsHandler.removePendingConsumerRequest(socket.id, producerId);
        throw new Error(`Producer ${producerId} not found`);
      }

      // consumer를 생성
      // consumer : producer의 스트림을 가져와 클라이언트에게 전달하는 역할
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // 일단 정지 상태로 생성
      });

      // 생성된 consumer를 peer의 맵에 저장
      peer.consumers.set(consumer.id, consumer);

      logger.info(
        `Consumer created: ${consumer.id} (${consumer.kind}) for ${socket.id}`
      );

      // 요청을 보낸 peer에게 성공했음을 알림
      socket.emit("consumer_created", {
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      this.roomEventsHandler.removePendingConsumerRequest(socket.id, producerId);
    } catch (error) {
      this.roomEventsHandler.removePendingConsumerRequest(socket.id, data.producerId);
      logger.error("Error creating consumer:", error);
      socket.emit("error", { message: "Failed to create consumer" });
    }
  }

  // 클라이언트가 미디어 스트림을 받을 준비가 되었을때 호출하여 paused 상태를 업데이트
  async handleResumeConsumer(socket: Socket, data: { consumerId: string }) {
    try {
      const { consumerId } = data;
      const peer = this.roomService.getPeer(socket.id);

      if (!peer) {
        throw new Error("Peer not found");
      }

      const consumer = peer.consumers.get(consumerId);
      if (!consumer) {
        throw new Error("Consumer not found");
      }

      // 중지된 스트림 전송을 다시 시작
      await consumer.resume();
      logger.info(`Consumer resumed: ${consumerId} for ${socket.id}`);

      // 클라이언트에게 consumer가 재개되었음을 알림
      socket.emit("consumer_resumed", { consumerId });
    } catch (error) {
      logger.error("Error resuming consumer:", error);
      socket.emit("error", { message: "Failed to resume consumer" });
    }
  }
}