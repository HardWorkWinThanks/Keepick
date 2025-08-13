import { ChatRepository } from "../repository/chat.repository";
import { ChatMessage, ChatParticipant, SendMessageData, EditMessageData, MessageType, MessagesResponse, MessageResponse } from "../types/chat.types";
import { logger } from "../../../utils/logger";

export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async joinChatRoom(roomId: string, participantId: string, participantName: string): Promise<ChatParticipant> {
    // 채팅방이 없으면 생성
    let room = this.chatRepository.getChatRoom(roomId);
    if (!room) {
      room = this.chatRepository.createChatRoom(roomId);
      logger.info(`Created new chat room: ${roomId}`);
    }

    const participant: ChatParticipant = {
      id: participantId,
      name: participantName,
      joinedAt: new Date(),
      isTyping: false,
      lastSeen: new Date(),
    };

    const success = this.chatRepository.addParticipant(roomId, participant);
    if (!success) {
      throw new Error('Failed to add participant to chat room');
    }

    logger.info(`Participant ${participantId} (${participantName}) joined chat room ${roomId}`);
    return participant;
  }

  leaveChatRoom(roomId: string, participantId: string): void {
    const participant = this.chatRepository.getParticipant(roomId, participantId);

    const success = this.chatRepository.removeParticipant(roomId, participantId);
    
    if (success) {
      logger.info(`Participant ${participantId} left chat room ${roomId}`);
      
      // 참여자가 없으면 채팅방 삭제
      const room = this.chatRepository.getChatRoom(roomId);
      if (room && room.participants.size === 0) {
        this.chatRepository.deleteChatRoom(roomId);
        logger.info(`Empty chat room deleted: ${roomId}`);
      }
    }
  }

  async sendMessage(data: SendMessageData, senderId: string, senderName: string): Promise<MessageResponse> {
    try {
      const { roomId, content, type, metadata } = data;
      
      // 빈 메시지 검증
      if (!content.trim()) {
        return { success: false, error: 'Message content cannot be empty' };
      }

      // 참여자 확인
      const participant = this.chatRepository.getParticipant(roomId, senderId);
      if (!participant) {
        return { success: false, error: 'Participant not found in chat room' };
      }

      // 메시지 생성
      const message = this.chatRepository.addMessage(roomId, {
        content: content.trim(),
        senderId,
        senderName,
        roomId,
        type: type || MessageType.TEXT,
        metadata,
      });

      if (!message) {
        return { success: false, error: 'Failed to add message to chat room' };
      }

      // 참여자 마지막 활동 시간 업데이트
      this.chatRepository.updateParticipantLastSeen(roomId, senderId);

      logger.info(`Message sent in room ${roomId} by ${senderId}: ${content.substring(0, 50)}...`);
      return { success: true, message };
    } catch (error) {
      logger.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  async editMessage(data: EditMessageData, editorId: string): Promise<MessageResponse> {
    try {
      const { roomId, messageId, content } = data;

      if (!content.trim()) {
        return { success: false, error: 'Message content cannot be empty' };
      }

      const originalMessage = this.chatRepository.getMessage(roomId, messageId);
      if (!originalMessage) {
        return { success: false, error: 'Message not found' };
      }

      // 본인 메시지만 수정 가능
      if (originalMessage.senderId !== editorId) {
        return { success: false, error: 'You can only edit your own messages' };
      }

      // 시스템 메시지는 수정 불가
      if (originalMessage.type === MessageType.SYSTEM) {
        return { success: false, error: 'System messages cannot be edited' };
      }

      const updatedMessage = this.chatRepository.updateMessage(roomId, messageId, content.trim());
      if (!updatedMessage) {
        return { success: false, error: 'Failed to edit message' };
      }

      logger.info(`Message edited in room ${roomId} by ${editorId}: ${messageId}`);
      return { success: true, message: updatedMessage };
    } catch (error) {
      logger.error('Error editing message:', error);
      return { success: false, error: 'Failed to edit message' };
    }
  }

  async deleteMessage(roomId: string, messageId: string, deleterId: string): Promise<MessageResponse> {
    try {
      const message = this.chatRepository.getMessage(roomId, messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      // 본인 메시지만 삭제 가능 (추후 관리자 권한 추가 가능)
      if (message.senderId !== deleterId) {
        return { success: false, error: 'You can only delete your own messages' };
      }

      const success = this.chatRepository.deleteMessage(roomId, messageId);
      if (!success) {
        return { success: false, error: 'Failed to delete message' };
      }

      logger.info(`Message deleted in room ${roomId} by ${deleterId}: ${messageId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }
  }

  async setTypingStatus(roomId: string, participantId: string, isTyping: boolean): Promise<boolean> {
    const success = this.chatRepository.updateParticipantTyping(roomId, participantId, isTyping);
    if (success) {
      logger.debug(`Typing status updated for ${participantId} in room ${roomId}: ${isTyping}`);
    }
    return success;
  }

  async getMessages(roomId: string, limit: number = 50, offset: number = 0, before?: Date): Promise<MessagesResponse> {
    try {
      const result = this.chatRepository.getMessages(roomId, limit, offset, before);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  getChatRoomsInfo() {
    return this.chatRepository.getChatRoomsInfo();
  }

  getChatRoom(roomId: string) {
    return this.chatRepository.getChatRoom(roomId);
  }

  getChatRoomByParticipantId(participantId: string) {
    return this.chatRepository.getChatRoomByParticipantId(participantId);
  }

  getParticipant(roomId: string, participantId: string) {
    return this.chatRepository.getParticipant(roomId, participantId);
  }
}