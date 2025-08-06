import { Request, Response } from "express";
import { chatService } from "../factory/chat.factory";
import { logger } from "../../../utils/logger";

class ChatController {
  async getChatRoomInfo(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = chatService.getChatRoom(roomId);

      if (!room) {
        res.status(404).json({ error: 'Chat room not found' });
        return;
      }

      const roomInfo = {
        id: room.id,
        participantsCount: room.participants.size,
        messagesCount: room.messages.length,
        createdAt: room.createdAt,
        settings: room.settings,
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          joinedAt: p.joinedAt,
          lastSeen: p.lastSeen,
          isTyping: p.isTyping,
        })),
        recentMessages: room.messages.slice(-10).map(msg => ({
          id: msg.id,
          content: msg.content,
          senderName: msg.senderName,
          timestamp: msg.timestamp,
          type: msg.type,
        })),
      };

      res.json(roomInfo);
    } catch (error) {
      logger.error('Error getting chat room info:', error);
      res.status(500).json({
        error: 'Failed to get chat room info',
      });
    }
  }

  async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0, before } = req.query;

      const beforeDate = before ? new Date(before as string) : undefined;
      const result = await chatService.getMessages(
        roomId,
        parseInt(limit as string),
        parseInt(offset as string),
        beforeDate
      );

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        messages: result.messages,
        total: result.total,
        hasMore: result.hasMore,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      res.status(500).json({
        error: 'Failed to get chat messages',
      });
    }
  }

  async deleteChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { roomId, messageId } = req.params;
      const { userId } = req.body; // 실제 구현시에는 인증 미들웨어에서 가져와야 함

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const result = await chatService.deleteMessage(roomId, messageId, userId);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true, messageId });
    } catch (error) {
      logger.error('Error deleting chat message:', error);
      res.status(500).json({
        error: 'Failed to delete chat message',
      });
    }
  }

  async getAllChatRooms(req: Request, res: Response): Promise<void> {
    try {
      const chatRooms = chatService.getChatRoomsInfo();
      res.json({ chatRooms });
    } catch (error) {
      logger.error('Error getting all chat rooms:', error);
      res.status(500).json({
        error: 'Failed to get chat rooms',
      });
    }
  }

  async getChatStats(req: Request, res: Response): Promise<void> {
    try {
      const chatRooms = chatService.getChatRoomsInfo();
      
      const stats = {
        totalChatRooms: chatRooms.length,
        totalParticipants: chatRooms.reduce((sum, room) => sum + room.participantsCount, 0),
        totalMessages: chatRooms.reduce((sum, room) => sum + room.messagesCount, 0),
        activeChatRooms: chatRooms.filter(room => room.participantsCount > 0).length,
        averageMessagesPerRoom: chatRooms.length > 0 
          ? (chatRooms.reduce((sum, room) => sum + room.messagesCount, 0) / chatRooms.length).toFixed(2)
          : 0,
        mostActiveRoom: chatRooms.length > 0 
          ? chatRooms.reduce((mostActive, room) => 
              room.messagesCount > mostActive.messagesCount ? room : mostActive
            )
          : null,
      };

      res.json(stats);
    } catch (error) {
      logger.error('Error getting chat stats:', error);
      res.status(500).json({
        error: 'Failed to get chat stats',
      });
    }
  }

  async clearChatRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = chatService.getChatRoom(roomId);

      if (!room) {
        res.status(404).json({ error: 'Chat room not found' });
        return;
      }

      // 모든 메시지 삭제 (실제로는 room.messages 배열을 비움)
      room.messages.length = 0;

      res.json({ 
        success: true, 
        message: `All messages in chat room ${roomId} have been cleared` 
      });

      logger.info(`🧹 Chat room ${roomId} messages cleared`);
    } catch (error) {
      logger.error('Error clearing chat room:', error);
      res.status(500).json({
        error: 'Failed to clear chat room',
      });
    }
  }
}

export const chatController = new ChatController();