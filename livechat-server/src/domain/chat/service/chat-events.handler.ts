import { Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { SendMessageData, EditMessageData, DeleteMessageData, TypingData, GetMessagesData } from "../types/chat.types";
import { logger } from "../../../utils/logger";

export class ChatEventsHandler {
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(private chatService: ChatService) {}

  async handleJoinChat(socket: Socket, data: { roomId: string; userName: string }) {
    try {
      const { roomId, userName } = data;
      
      const participant = await this.chatService.joinChatRoom(roomId, socket.id, userName);
      
      // 채팅방 입장
      socket.join(`chat_${roomId}`);
      
      // 최근 메시지 전송
      const messagesResponse = await this.chatService.getMessages(roomId, 50);
      socket.emit('chat_messages_history', messagesResponse);
      
      // 다른 참여자들에게 입장 알림
      socket.to(`chat_${roomId}`).emit('chat_user_joined', {
        participant: {
          id: participant.id,
          name: participant.name,
          joinedAt: participant.joinedAt,
        },
      });
      
      // 입장 확인 응답
      socket.emit('chat_joined', {
        success: true,
        roomId,
        participant,
      });
      
      logger.info(`${socket.id} (${userName}) joined chat room ${roomId}`);
    } catch (error) {
      logger.error(`Error joining chat room for ${socket.id}:`, error);
      socket.emit('chat_error', { message: 'Failed to join chat room' });
    }
  }

  handleLeaveChat(socket: Socket, data?: { roomId: string }) {
    try {
      const roomId = data?.roomId;
      
      if (roomId) {
        // 특정 채팅방 떠나기
        this.leaveChatRoom(socket, roomId);
      } else {
        // 모든 채팅방에서 떠나기 (연결 해제 시)
        const rooms = Array.from(socket.rooms).filter(room => room.startsWith('chat_'));
        rooms.forEach(room => {
          const extractedRoomId = room.replace('chat_', '');
          this.leaveChatRoom(socket, extractedRoomId);
        });
      }
    } catch (error) {
      logger.error(`Error leaving chat room for ${socket.id}:`, error);
      socket.emit('chat_error', { message: 'Failed to leave chat room' });
    }
  }

  private leaveChatRoom(socket: Socket, roomId: string): void {
    const participant = this.chatService.getParticipant(roomId, socket.id);
    
    this.chatService.leaveChatRoom(roomId, socket.id);
    socket.leave(`chat_${roomId}`);
    
    // 타이핑 타이머 정리
    const typingKey = `${socket.id}_${roomId}`;
    const timeout = this.typingTimeouts.get(typingKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(typingKey);
    }
    
    // 다른 참여자들에게 퇴장 알림
    if (participant) {
      socket.to(`chat_${roomId}`).emit('chat_user_left', {
        participantId: socket.id,
        participantName: participant.name,
      });
    }
    
    socket.emit('chat_left', { success: true, roomId });
    logger.info(`${socket.id} left chat room ${roomId}`);
  }

  async handleSendMessage(socket: Socket, data: SendMessageData) {
    console.log(`Handling send [${data.content}] for room ${data.roomId} from ${socket.id}`);
    try {
      const participant = this.chatService.getParticipant(data.roomId, socket.id);
      if (!participant) {
        socket.emit('chat_error', { message: 'You are not in this chat room' });
        return;
      }

      const result = await this.chatService.sendMessage(data, socket.id, participant.name);
      
      if (result.success && result.message) {
        // 채팅방 모든 참여자에게 메시지 브로드캐스트
        socket.to(`chat_${data.roomId}`).emit('chat_new_message', result.message);
        
        // 발신자에게 성공 응답
        socket.emit('chat_message_sent', {
          success: true,
          message: result.message,
        });
      } else {
        socket.emit('chat_message_sent', {
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Error sending chat message:', error);
      socket.emit('chat_error', { message: 'Failed to send message' });
    }
  }

  async handleEditMessage(socket: Socket, data: EditMessageData) {
    try {
      const result = await this.chatService.editMessage(data, socket.id);
      
      if (result.success && result.message) {
        // 채팅방 모든 참여자에게 수정된 메시지 브로드캐스트
        socket.to(`chat_${data.roomId}`).emit('chat_message_edited', result.message);
        
        // 발신자에게 성공 응답
        socket.emit('chat_message_edit_result', {
          success: true,
          message: result.message,
        });
      } else {
        socket.emit('chat_message_edit_result', {
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Error editing chat message:', error);
      socket.emit('chat_error', { message: 'Failed to edit message' });
    }
  }

  async handleDeleteMessage(socket: Socket, data: DeleteMessageData) {
    try {
      const result = await this.chatService.deleteMessage(data.roomId, data.messageId, socket.id);
      
      if (result.success) {
        // 채팅방 모든 참여자에게 삭제 알림
        socket.to(`chat_${data.roomId}`).emit('chat_message_deleted', {
          messageId: data.messageId,
          roomId: data.roomId,
        });
        
        // 발신자에게 성공 응답
        socket.emit('chat_message_delete_result', {
          success: true,
          messageId: data.messageId,
        });
      } else {
        socket.emit('chat_message_delete_result', {
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Error deleting chat message:', error);
      socket.emit('chat_error', { message: 'Failed to delete message' });
    }
  }

  async handleTyping(socket: Socket, data: TypingData) {
    try {
      const { roomId, isTyping } = data;
      const participant = this.chatService.getParticipant(roomId, socket.id);
      
      if (!participant) {
        return;
      }

      const success = await this.chatService.setTypingStatus(roomId, socket.id, isTyping);
      
      if (success) {
        // 다른 참여자들에게 타이핑 상태 브로드캐스트
        socket.to(`chat_${roomId}`).emit('chat_user_typing', {
          participantId: socket.id,
          participantName: participant.name,
          isTyping,
        });

        // 타이핑 상태 자동 해제 타이머
        const typingKey = `${socket.id}_${roomId}`;
        const existingTimeout = this.typingTimeouts.get(typingKey);
        
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (isTyping) {
          const timeout = setTimeout(() => {
            this.chatService.setTypingStatus(roomId, socket.id, false);
            socket.to(`chat_${roomId}`).emit('chat_user_typing', {
              participantId: socket.id,
              participantName: participant.name,
              isTyping: false,
            });
            this.typingTimeouts.delete(typingKey);
          }, 3000); // 3초 후 자동 해제

          this.typingTimeouts.set(typingKey, timeout);
        }
      }
    } catch (error) {
      logger.error('Error handling typing status:', error);
    }
  }

  async handleGetMessages(socket: Socket, data: GetMessagesData) {
    try {
      const { roomId, limit, offset, before } = data;
      
      const participant = this.chatService.getParticipant(roomId, socket.id);
      if (!participant) {
        socket.emit('chat_error', { message: 'You are not in this chat room' });
        return;
      }

      const result = await this.chatService.getMessages(roomId, limit, offset, before);
      socket.emit('chat_messages', result);
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      socket.emit('chat_error', { message: 'Failed to get messages' });
    }
  }

  handleGetChatInfo(socket: Socket, data: { roomId: string }) {
    try {
      const { roomId } = data;
      const room = this.chatService.getChatRoom(roomId);
      
      if (!room) {
        socket.emit('chat_info', { error: 'Chat room not found' });
        return;
      }

      const chatInfo = {
        roomId: room.id,
        participantsCount: room.participants.size,
        messagesCount: room.messages.length,
        createdAt: room.createdAt,
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          joinedAt: p.joinedAt,
          isTyping: p.isTyping,
          lastSeen: p.lastSeen,
        })),
        settings: room.settings,
      };

      socket.emit('chat_info', chatInfo);
    } catch (error) {
      logger.error('Error getting chat info:', error);
      socket.emit('chat_error', { message: 'Failed to get chat info' });
    }
  }
}