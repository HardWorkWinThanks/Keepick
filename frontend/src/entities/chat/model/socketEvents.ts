// src/entities/chat/model/socketEvents.ts
import { AppDispatch } from "@/shared/config/store";
import {
  addMessage,
  addSystemMessage,
  addTemporaryMessage,
  removeTemporaryMessage,
  setMessages,
  ChatMessage,
} from "./slice";
import { chatHandler } from "@/shared/api/socket";

// 서버에서 받는 채팅 메시지 타입 (서버 API에 맞게 수정)
export interface ServerChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  roomId: string;
  timestamp: string; // Date가 아닌 string으로 받음
  type: string;
  metadata?: any;
}

export class ChatSocketHandler {
  private dispatch: AppDispatch | null = null;
  private currentRoomId: string | null = null;
  private currentUserName: string | null = null;
  private isTyping: boolean = false;
  private typingTimeout: NodeJS.Timeout | null = null;
  private pendingMessages: Map<string, string> = new Map(); // tempId -> realId 매핑

  public init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
    console.log("💬 [CLIENT] ChatSocketHandler initialized");
  }

  public setRoomInfo(roomId: string, userName: string) {
    console.log(`💬 [CLIENT] Setting room info: ${roomId}, user: ${userName}`);
    this.currentRoomId = roomId;
    this.currentUserName = userName;

    // 채팅방 입장
    chatHandler.joinChat({ roomId, userName });
  }

  // 메시지 전송 (중복 방지 로직 추가)
  public sendMessage(content: string) {
    if (!this.currentRoomId) {
      console.error("💬 [CLIENT] ❌ Room ID not set");
      return;
    }

    console.log(
      `💬 [CLIENT] 📤 Sending message: "${content}" to room ${this.currentRoomId}`
    );

    // 임시 메시지 ID 생성 (서버 응답 전까지 UI에 표시용)
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    // 서버 API에 맞는 형태로 메시지 전송
    chatHandler.sendChatMessage({
      roomId: this.currentRoomId,
      content,
      messageType: "text",
    });

    // 임시 메시지를 UI에 즉시 표시 (로딩 상태 표시)
    if (this.dispatch && this.currentUserName) {
      const tempMessage: ChatMessage = {
        id: tempId,
        type: "user",
        content,
        sender: {
          id: "current-user",
          name: this.currentUserName,
        },
        timestamp: new Date().toISOString(), // Date를 string으로 변환
        isTemporary: true, // 임시 메시지 표시
      };

      this.dispatch(addTemporaryMessage(tempMessage));
      console.log(`💬 [CLIENT] ✅ Added temporary message to UI: ${tempId}`);
    }
  }

  // 다른 사용자의 메시지 수신
  public handleReceivedMessage(data: ServerChatMessage) {
    console.log(
      `💬 [CLIENT] 📨 Received message from ${data.senderName}:`,
      data
    );

    if (this.dispatch) {
      const chatMessage: ChatMessage = {
        id: data.id,
        type: "user",
        content: data.content,
        sender: {
          id: data.senderId,
          name: data.senderName,
        },
        timestamp: data.timestamp, // 이미 string 형태로 받음
      };
      this.dispatch(addMessage(chatMessage));
      console.log(
        `💬 [CLIENT] ✅ Added received message to UI: ${chatMessage.id}`
      );
    }
  }

  // 자신의 메시지 전송 결과 처리 (중복 방지)
  public handleMessageSent(data: {
    success: boolean;
    message?: ServerChatMessage;
    error?: string;
  }) {
    console.log(`💬 [CLIENT] 📤 Message send result:`, data);

    if (!data.success) {
      console.error(`💬 [CLIENT] ❌ Failed to send message: ${data.error}`);
      // 실패한 경우 임시 메시지 제거 또는 에러 표시
      return;
    }

    if (data.message && this.dispatch) {
      // 서버에서 확정된 메시지 정보로 업데이트
      const confirmedMessage: ChatMessage = {
        id: data.message.id,
        type: "user",
        content: data.message.content,
        sender: {
          id: data.message.senderId,
          name: data.message.senderName,
        },
        timestamp: data.message.timestamp, // 이미 string 형태
        isTemporary: false,
      };

      // 임시 메시지를 확정 메시지로 교체
      this.dispatch(addMessage(confirmedMessage));
      console.log(`💬 [CLIENT] ✅ Confirmed message sent: ${data.message.id}`);
    }
  }

  // 메시지 히스토리 처리 (대량 메시지 중복 제거)
  public handleMessageHistory(data: {
    success: boolean;
    messages?: ServerChatMessage[];
  }) {
    console.log(`💬 [CLIENT] 📚 Received message history:`, data);

    if (this.dispatch && data.success && data.messages) {
      const historyMessages: ChatMessage[] = data.messages.map((serverMsg) => ({
        id: serverMsg.id,
        type: serverMsg.type === "system" ? "system" : "user",
        content: serverMsg.content,
        sender:
          serverMsg.type === "system"
            ? undefined
            : {
                id: serverMsg.senderId,
                name: serverMsg.senderName,
              },
        timestamp: serverMsg.timestamp, // 이미 string 형태로 받음
      }));

      // 히스토리는 setMessages로 중복 제거하며 설정
      this.dispatch(setMessages(historyMessages));
      console.log(
        `💬 [CLIENT] ✅ Set ${historyMessages.length} history messages (deduped)`
      );
    }
  }

  // 타이핑 상태 전송
  public setTypingStatus(isTyping: boolean) {
    if (!this.currentRoomId) return;

    // 이미 같은 상태면 무시
    if (this.isTyping === isTyping) return;

    this.isTyping = isTyping;
    console.log(`💬 [CLIENT] ⌨️ Setting typing status: ${isTyping}`);

    // 서버에 타이핑 상태 전송
    chatHandler.sendTypingStatus({
      roomId: this.currentRoomId,
      isTyping,
    });

    // 타이핑 중일 때 자동 해제 타이머 설정
    if (isTyping) {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      this.typingTimeout = setTimeout(() => {
        this.setTypingStatus(false);
      }, 2000); // 2초 후 자동 해제
    } else {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
    }
  }

  // 다른 사용자의 타이핑 상태 수신
  public handleUserTyping(data: {
    participantId: string;
    participantName: string;
    isTyping: boolean;
  }) {
    console.log(
      `💬 [CLIENT] ⌨️ ${data.participantName} is ${
        data.isTyping ? "typing" : "not typing"
      }`
    );

    // 커스텀 이벤트로 TypingIndicator 컴포넌트에 전달
    const event = new CustomEvent("chatUserTyping", {
      detail: {
        participantId: data.participantId,
        participantName: data.participantName,
        isTyping: data.isTyping,
      },
    });
    window.dispatchEvent(event);
  }

  // 시스템 메시지 처리
  public handleUserJoined(userName: string) {
    console.log(`💬 [CLIENT] 👋 User joined: ${userName}`);
    if (this.dispatch && userName && userName !== "undefined") {
      this.dispatch(addSystemMessage(`${userName}님이 입장했습니다.`));
    }
  }

  public handleUserLeft(userName: string) {
    console.log(`💬 [CLIENT] 👋 User left: ${userName}`);
    if (this.dispatch && userName && userName !== "undefined") {
      this.dispatch(addSystemMessage(`${userName}님이 퇴장했습니다.`));
    }
  }

  public handleRoomJoined() {
    console.log(`💬 [CLIENT] 🏠 Joined room: ${this.currentRoomId}`);
    if (this.dispatch) {
      this.dispatch(
        addSystemMessage("회의실에 입장했습니다. 채팅을 시작해보세요!")
      );
    }
  }

  // 채팅방 나가기
  public leaveChat() {
    console.log(`💬 [CLIENT] 🚪 Leaving chat room: ${this.currentRoomId}`);

    if (this.currentRoomId) {
      // 타이핑 상태 해제
      if (this.isTyping) {
        this.setTypingStatus(false);
      }

      chatHandler.leaveChat({ roomId: this.currentRoomId });

      // 타이핑 타이머 정리
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }

      // 대기 중인 메시지 정리
      this.pendingMessages.clear();

      this.currentRoomId = null;
      this.currentUserName = null;
      this.isTyping = false;
    }
  }

  // 에러 처리
  public handleChatError(data: { message: string }) {
    console.error(`💬 [CLIENT] ❌ Chat error: ${data.message}`);
    if (this.dispatch) {
      this.dispatch(addSystemMessage(`오류: ${data.message}`));
    }
  }
}

export const chatSocketHandler = new ChatSocketHandler();
