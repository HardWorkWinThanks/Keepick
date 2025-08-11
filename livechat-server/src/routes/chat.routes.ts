import { Router } from "express";
import { chatController } from "../domain/chat/controller/chat.controller";

const router = Router();

// 채팅방 관련 엔드포인트
router.get("/chat/rooms", chatController.getAllChatRooms);
router.get("/chat/rooms/:roomId", chatController.getChatRoomInfo);
router.get("/chat/rooms/:roomId/messages", chatController.getChatMessages);
router.delete("/chat/rooms/:roomId/messages/:messageId", chatController.deleteChatMessage);
router.delete("/chat/rooms/:roomId/clear", chatController.clearChatRoom);

// 통계 엔드포인트
router.get("/chat/stats", chatController.getChatStats);

export { router as chatRouter };