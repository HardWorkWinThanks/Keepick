// src/shared/api/socket/chatHandler.ts

import { Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";
import {
  SendMessageData,
  ChatJoinData,
  ChatLeaveData,
  TypingData,
} from "@/shared/types/socket.types";

class ChatHandler {
  private socket: Socket | null = null;
  private dispatch: AppDispatch | null = null;
  
  public initialize(socket: Socket, dispatch: AppDispatch) {
    this.socket = socket;
    this.dispatch = dispatch;
    chatSocketHandler.init(dispatch);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;
    
    this.socket.on("chat_new_message", (data) => chatSocketHandler.handleReceivedMessage(data));
    this.socket.on("chat_message_sent", (data) => chatSocketHandler.handleMessageSent(data));
    this.socket.on("chat_messages_history", (data) => chatSocketHandler.handleMessageHistory(data));
    this.socket.on("chat_user_joined", (data: { participant: { id: string; name: string; joinedAt: string } }) => chatSocketHandler.handleUserJoined(data.participant));
    this.socket.on("chat_user_left", (data: { participantId: string; participantName: string }) => chatSocketHandler.handleUserLeft(data.participantId, data.participantName));
    this.socket.on("chat_user_typing", (data) => chatSocketHandler.handleUserTyping(data));
    this.socket.on("chat_info", (data) => chatSocketHandler.handleChatInfo(data));
    this.socket.on("chat_joined", (data) => chatSocketHandler.handleChatJoined(data));
    this.socket.on("chat_error", (data) => chatSocketHandler.handleChatError(data));
  }
    
  private emit(event: string, ...args: unknown[]) {
      this.socket?.emit(event, ...args);
  }

  public sendChatMessage = (data: SendMessageData) => this.emit("chat_send_message", data);
  public joinChat = (data: ChatJoinData) => this.emit("chat_join", data);
  public leaveChat = (data?: ChatLeaveData) => this.emit("chat_leave", data);
  public sendTypingStatus = (data: TypingData) => this.emit("chat_typing", data);
  public getChatInfo = (data: { roomId: string }) => this.emit("chat_get_info", data);
}

export const chatHandler = new ChatHandler();
