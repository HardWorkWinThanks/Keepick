import { ChatService } from "../service/chat.service";
import { ChatRepository } from "../repository/chat.repository";

class ChatFactory {
  private static instance: ChatService;

  static getInstance(): ChatService {
    if (!this.instance) {
      const chatRepository = new ChatRepository();
      this.instance = new ChatService(chatRepository);
    }
    return this.instance;
  }
}

export const chatService = ChatFactory.getInstance();