import { Router } from "express";
import { roomController } from "../domain/room/controller/room.controller";

const router = Router();

// Room related routes
router.get("/rtp-capabilities/:roomId", roomController.getRtpCapabilities);
router.get("/rooms/:roomId", roomController.getRoomInfo);
router.get("/rooms", roomController.getAllRooms);
router.delete("/rooms/:roomId", roomController.deleteRoom);
router.get("/rooms/:roomId/peers/:peerId", roomController.getPeerInfo);
router.get("/system/stats", roomController.getSystemStats);
export { router as mediaRouter };
