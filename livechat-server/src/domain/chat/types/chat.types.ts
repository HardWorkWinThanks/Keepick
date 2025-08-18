export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  roomId: string;
  timestamp: Date;
  type: MessageType;
  metadata?: MessageMetadata;
}

export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  SYSTEM = 'system',
  FILE = 'file',
  IMAGE = 'image',
}

export interface MessageMetadata {
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  mentions?: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ChatRoom {
  id: string;
  messages: ChatMessage[];
  participants: Map<string, ChatParticipant>;
  createdAt: Date;
  settings: ChatRoomSettings;
}

export interface ChatParticipant {
  id: string;
  name: string;
  joinedAt: Date;
  isTyping: boolean;
  lastSeen: Date;
}

export interface ChatRoomSettings {
  maxMessages: number;
  allowFileUpload: boolean;
  allowEmojis: boolean;
  moderationEnabled: boolean;
}

// Socket Event Data Types
export interface SendMessageData {
  roomId: string;
  content: string;
  type: MessageType;
  metadata?: Partial<MessageMetadata>;
}

export interface EditMessageData {
  roomId: string;
  messageId: string;
  content: string;
}

export interface DeleteMessageData {
  roomId: string;
  messageId: string;
}

export interface TypingData {
  roomId: string;
  isTyping: boolean;
}

export interface GetMessagesData {
  roomId: string;
  limit?: number;
  offset?: number;
  before?: Date;
}

// Response Types
export interface MessageResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

export interface MessagesResponse {
  success: boolean;
  messages?: ChatMessage[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

export interface ChatRoomInfo {
  id: string;
  participantsCount: number;
  messagesCount: number;
  createdAt: Date;
  lastActivity: Date;
}