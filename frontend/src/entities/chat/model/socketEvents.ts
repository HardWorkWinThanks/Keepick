// src/entities/chat/model/socketEvents.ts
import { AppDispatch } from "@/shared/config/store";
import { addMessage, addSystemMessage, ChatMessage } from "./slice";
import { socketApi } from "@/shared/api/socketApi";

// 서버에서 받는 채팅 메시지 타입 (서버 API에 맞게 수정)
export interface ServerChatMessage {
  messageId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  messageType: string;
  roomId: string;
}

export class ChatSocketHandler {
  private dispatch: AppDispatch | null = null;
  private currentRoomId: string | null = null;
  private currentUserName: string | null = null;

  public init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  public setRoomInfo(roomId: string, userName: string) {
    this.currentRoomId = roomId;
    this.currentUserName = userName;

    // 채팅방 입장
    socketApi.joinChat({ roomId, userName });
  }

  // 메시지 전송 (서버 API에 맞게 수정)
  public sendMessage(content: string) {
    if (!this.currentRoomId) {
      console.error("Room ID not set");
      return;
    }

    // 서버 API에 맞는 형태로 메시지 전송
    socketApi.sendChatMessage({
      roomId: this.currentRoomId,
      content,
      messageType: "text",
    });

    // 자신의 메시지는 즉시 UI에 표시
    if (this.dispatch && this.currentUserName) {
      const chatMessage: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        type: "user",
        content,
        sender: {
          id: socketApi.getSocketId() || "unknown",
          name: this.currentUserName,
        },
        timestamp: new Date(),
      };
      this.dispatch(addMessage(chatMessage));
    }
  }

  // 다른 사용자의 메시지 수신 (서버 형태에 맞게 수정)
  public handleReceivedMessage(data: ServerChatMessage) {
    if (this.dispatch) {
      const chatMessage: ChatMessage = {
        id: data.messageId,
        type: "user",
        content: data.content,
        sender: {
          id: data.senderId,
          name: data.senderName,
        },
        timestamp: new Date(data.timestamp),
      };
      this.dispatch(addMessage(chatMessage));
    }
  }

  // 시스템 메시지 처리
  public handleUserJoined(userName: string) {
    if (this.dispatch) {
      this.dispatch(addSystemMessage(`${userName}님이 입장했습니다.`));
    }
  }

  public handleUserLeft(userName: string) {
    if (this.dispatch) {
      this.dispatch(addSystemMessage(`${userName}님이 퇴장했습니다.`));
    }
  }

  public handleRoomJoined() {
    if (this.dispatch) {
      this.dispatch(
        addSystemMessage("회의실에 입장했습니다. 채팅을 시작해보세요!")
      );
    }
  }

  // 채팅방 나가기
  public leaveChat() {
    if (this.currentRoomId) {
      socketApi.leaveChat({ roomId: this.currentRoomId });
      this.currentRoomId = null;
      this.currentUserName = null;
    }
  }
}

export const chatSocketHandler = new ChatSocketHandler();
