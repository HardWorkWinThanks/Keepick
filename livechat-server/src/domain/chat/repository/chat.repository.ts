import { ChatMessage, ChatRoom, ChatParticipant, ChatRoomSettings, MessageType } from "../types/chat.types";
import { v4 as uuidv4 } from 'uuid';

export class ChatRepository {
  private chatRooms: Map<string, ChatRoom> = new Map();
  private readonly DEFAULT_SETTINGS: ChatRoomSettings = {
    maxMessages: 1000,
    allowFileUpload: true,
    allowEmojis: true,
    moderationEnabled: false,
  };

  createChatRoom(roomId: string, settings?: Partial<ChatRoomSettings>): ChatRoom {
    if (this.chatRooms.has(roomId)) {
      return this.chatRooms.get(roomId)!;
    }

    const chatRoom: ChatRoom = {
      id: roomId,
      messages: [],
      participants: new Map(),
      createdAt: new Date(),
      settings: { ...this.DEFAULT_SETTINGS, ...settings },
    };

    this.chatRooms.set(roomId, chatRoom);
    return chatRoom;
  }

  getChatRoom(roomId: string): ChatRoom | undefined {
    return this.chatRooms.get(roomId);
  }

  getChatRoomByParticipantId(participantId: string): ChatRoom | undefined {
    for (const room of this.chatRooms.values()) {
      if (room.participants.has(participantId)) {
        return room;
      }
    }
    return undefined;
  }

  deleteChatRoom(roomId: string): boolean {
    return this.chatRooms.delete(roomId);
  }

  addParticipant(roomId: string, participant: ChatParticipant): boolean {
    const room = this.getChatRoom(roomId);
    if (!room) return false;

    room.participants.set(participant.id, participant);
    return true;
  }

  removeParticipant(roomId: string, participantId: string): boolean {
    const room = this.getChatRoom(roomId);
    if (!room) return false;

    return room.participants.delete(participantId);
  }

  getParticipant(roomId: string, participantId: string): ChatParticipant | undefined {
    const room = this.getChatRoom(roomId);
    return room?.participants.get(participantId);
  }

  updateParticipantTyping(roomId: string, participantId: string, isTyping: boolean): boolean {
    const participant = this.getParticipant(roomId, participantId);
    if (!participant) return false;

    participant.isTyping = isTyping;
    return true;
  }

  updateParticipantLastSeen(roomId: string, participantId: string): boolean {
    const participant = this.getParticipant(roomId, participantId);
    if (!participant) return false;

    participant.lastSeen = new Date();
    return true;
  }

  addMessage(roomId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage | null {
    const room = this.getChatRoom(roomId);
    if (!room) return null;

    const message: ChatMessage = {
      ...messageData,
      id: uuidv4(),
      timestamp: new Date(),
    };

    room.messages.push(message);

    // 메시지 수 제한 적용
    if (room.messages.length > room.settings.maxMessages) {
      room.messages = room.messages.slice(-room.settings.maxMessages);
    }

    return message;
  }

  getMessage(roomId: string, messageId: string): ChatMessage | undefined {
    const room = this.getChatRoom(roomId);
    if (!room) return undefined;

    return room.messages.find(msg => msg.id === messageId);
  }

  updateMessage(roomId: string, messageId: string, content: string): ChatMessage | null {
    const room = this.getChatRoom(roomId);
    if (!room) return null;

    const messageIndex = room.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return null;

    const message = room.messages[messageIndex];
    message.content = content;
    message.metadata = {
      ...message.metadata,
      edited: true,
      editedAt: new Date(),
    };

    return message;
  }

  deleteMessage(roomId: string, messageId: string): boolean {
    const room = this.getChatRoom(roomId);
    if (!room) return false;

    const messageIndex = room.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;

    room.messages.splice(messageIndex, 1);
    return true;
  }

  getMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0,
    before?: Date
  ): { messages: ChatMessage[]; total: number; hasMore: boolean } {
    const room = this.getChatRoom(roomId);
    if (!room) {
      return { messages: [], total: 0, hasMore: false };
    }

    let messages = room.messages;

    // before 날짜 필터링
    if (before) {
      messages = messages.filter(msg => msg.timestamp < before);
    }

    // 최신 메시지 순으로 정렬
    messages = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = messages.length;
    const paginatedMessages = messages.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // 반환할 때는 오래된 순으로 정렬
    return {
      messages: paginatedMessages.reverse(),
      total,
      hasMore,
    };
  }

  getSystemMessage(roomId: string, content: string): ChatMessage {
    return {
      id: uuidv4(),
      content,
      senderId: 'system',
      senderName: 'System',
      roomId,
      timestamp: new Date(),
      type: MessageType.SYSTEM,
    };
  }

  getChatRoomsInfo() {
    return Array.from(this.chatRooms.entries()).map(([id, room]) => ({
      id,
      participantsCount: room.participants.size,
      messagesCount: room.messages.length,
      createdAt: room.createdAt,
      lastActivity: room.messages.length > 0 
        ? room.messages[room.messages.length - 1].timestamp 
        : room.createdAt,
    }));
  }
}