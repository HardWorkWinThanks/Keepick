// src/entities/chat/model/socketEvents.ts
import { AppDispatch } from "@/shared/config/store";
import {
  addMessage,
  addSystemMessage,
  addTemporaryMessage,
  removeTemporaryMessage,
  setMessages,
  ChatMessage,
  ChatParticipant,
  addParticipant,
  removeParticipant,
  updateParticipantTyping,
  setChatInfo,
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
  private isInitialized: boolean = false;
  private isTyping: boolean = false;
  private typingTimeout: NodeJS.Timeout | null = null;
  private pendingMessages: Map<string, { tempId: string; content: string; roomId: string }> =
    new Map();
  private lastSentMessage: { content: string; timestamp: number } | null = null;

  public init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
    console.log("💬 [CLIENT] ChatSocketHandler initialized");
  }

  public setRoomInfo(roomId: string, userName: string) {
    console.log(`💬 [CLIENT] 🔄 Setting room info: ${roomId}, user: ${userName}`);
    console.log(
      `💬 [CLIENT] Previous state - dispatch: ${!!this.dispatch}, currentRoomId: ${
        this.currentRoomId
      }, currentUserName: ${this.currentUserName}, isInitialized: ${this.isInitialized}`
    );

    // 이미 같은 정보로 초기화되었다면 스킵
    if (this.isInitialized && this.currentRoomId === roomId && this.currentUserName === userName) {
      console.log(`💬 [CLIENT] ⏭️ Already initialized with same info, skipping...`);
      return;
    }

    this.currentRoomId = roomId;
    this.currentUserName = userName;
    this.isInitialized = true;

    console.log(
      `💬 [CLIENT] ✅ New state - currentRoomId: ${this.currentRoomId}, currentUserName: ${this.currentUserName}, initialized: ${this.isInitialized}`
    );

    // 채팅방 입장
    console.log(`💬 [CLIENT] 🚪 Joining chat room...`);
    chatHandler.joinChat({ roomId, userName });

    // 채팅방 정보 요청 (참가자 수 등) - 즉시 요청
    console.log(`💬 [CLIENT] 📋 Requesting chat info...`);
    chatHandler.getChatInfo({ roomId });
  }

  // 메시지 전송 (중복 방지 로직 추가)
  public sendMessage(content: string) {
    if (!this.currentRoomId || !this.currentUserName || !this.dispatch) {
      console.error(`💬 [CLIENT] ❌ Cannot send message - missing data:`, {
        currentRoomId: this.currentRoomId,
        currentUserName: this.currentUserName,
        dispatch: !!this.dispatch
      });
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;

    // 중복 메시지 방지 (1초 내 같은 내용 전송 방지)
    const now = Date.now();
    if (this.lastSentMessage && 
        this.lastSentMessage.content === trimmed && 
        now - this.lastSentMessage.timestamp < 1000) {
      console.warn(`💬 [CLIENT] ⚠️ Duplicate message blocked: "${trimmed}"`);
      return;
    }

    this.lastSentMessage = { content: trimmed, timestamp: now };
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    // 서버 전송
    console.log(`💬 [CLIENT] 📤 Sending message to server:`, {
      roomId: this.currentRoomId,
      content: trimmed,
      userName: this.currentUserName
    });
    
    chatHandler.sendChatMessage({
      roomId: this.currentRoomId,
      content: trimmed,
      messageType: "text",
      userName: this.currentUserName,
    });

    // 펜딩 등록(확정시 매핑 제거 위해)
    this.pendingMessages.set(tempId, { tempId, content: trimmed, roomId: this.currentRoomId });

    // 임시 메시지 표시 (전송중 상태)
    const tempMessage: ChatMessage = {
      id: tempId,
      tempId,
      type: "user",
      content: trimmed,
      sender: { id: "current-user", name: this.currentUserName || "나" },
      timestamp: new Date().toISOString(),
      isTemporary: true,
      isError: false,
      isSending: true,
    };
    this.dispatch(addTemporaryMessage(tempMessage));
    console.log(`💬 [CLIENT] 📤 Added temporary message: ${tempId}`);
  }

  // 다른 사용자의 메시지 수신
  public handleReceivedMessage(data: ServerChatMessage) {
    console.log(`💬 [CLIENT] 📨 Received message from ${data.senderName}:`, data);

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
      console.log(`💬 [CLIENT] ✅ Added received message to UI: ${chatMessage.id}`);
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
      // 실패한 임시 메시지를 에러 상태로 업데이트
      if (this.dispatch) {
        const failedMessages = Array.from(this.pendingMessages.values());
        failedMessages.forEach(pending => {
          const errorMessage: ChatMessage = {
            id: pending.tempId,
            tempId: pending.tempId,
            type: "user",
            content: pending.content,
            sender: { id: "current-user", name: this.currentUserName || "나" },
            timestamp: new Date().toISOString(),
            isTemporary: false,
            isError: true,
          };
          this.dispatch!(addMessage(errorMessage));
        });
        this.dispatch(removeTemporaryMessage("all"));
      }
      return;
    }

    if (data.message && this.dispatch) {
      // 🆕 임시 메시지들을 모두 제거 (확정 메시지로 교체하기 위해)
      this.dispatch(removeTemporaryMessage("all"));

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
        isError: false,
      };

      // 확정 메시지 추가
      this.dispatch(addMessage(confirmedMessage));
      console.log(`💬 [CLIENT] ✅ Confirmed message sent: ${data.message.id}`);
      
      // 펜딩 메시지 정리
      this.pendingMessages.clear();
    }
  }

  // 메시지 히스토리 처리 (대량 메시지 중복 제거)
  public handleMessageHistory(data: { success: boolean; messages?: ServerChatMessage[] }) {
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
      console.log(`💬 [CLIENT] ✅ Set ${historyMessages.length} history messages (deduped)`);
    }
  }

  // 타이핑 상태 전송
  public setTypingStatus(isTyping: boolean) {
    if (!this.currentRoomId || !this.currentUserName) {
      console.error(`💬 [CLIENT] ❌ Cannot send typing status - missing data:`, {
        currentRoomId: this.currentRoomId,
        currentUserName: this.currentUserName
      });
      return;
    }

    // 이미 같은 상태면 무시
    if (this.isTyping === isTyping) return;

    this.isTyping = isTyping;
    console.log(`💬 [CLIENT] ⌨️ Setting typing status: ${isTyping}`);

    // 서버에 타이핑 상태 전송
    chatHandler.sendTypingStatus({
      roomId: this.currentRoomId,
      isTyping,
      userName: this.currentUserName,
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
      `💬 [CLIENT] ⌨️ ${data.participantName} is ${data.isTyping ? "typing" : "not typing"}`
    );

    // Redux에서 타이핑 상태 업데이트
    if (this.dispatch) {
      this.dispatch(
        updateParticipantTyping({
          id: data.participantId,
          isTyping: data.isTyping,
        })
      );
    }

    // 커스텀 이벤트로 TypingIndicator 컴포넌트에 전달 (기존 호환성)
    const event = new CustomEvent("chatUserTyping", {
      detail: {
        participantId: data.participantId,
        participantName: data.participantName,
        isTyping: data.isTyping,
      },
    });
    window.dispatchEvent(event);
  }

  // 참가자 관리 이벤트 처리
  public handleUserJoined(participant: { id: string; name: string; joinedAt: string }) {
    console.log(`💬 [CLIENT] 👋 User joined: ${participant.name}`);
    if (this.dispatch) {
      // 자신은 참가자 목록에 추가하지 않음
      if (participant.name !== this.currentUserName) {
        this.dispatch(
          addParticipant({
            id: participant.id,
            name: participant.name,
            joinedAt: participant.joinedAt,
            isTyping: false,
          })
        );

        // 시스템 메시지 추가 (자신이 아닌 경우에만)
        if (participant.name && participant.name !== "undefined") {
          this.dispatch(addSystemMessage(`${participant.name}님이 입장했습니다.`));
        }
      }
    }
  }

  public handleUserLeft(participantId: string, participantName: string) {
    console.log(`💬 [CLIENT] 👋 User left: ${participantName}`);
    if (this.dispatch) {
      // 참가자 목록에서 제거
      this.dispatch(removeParticipant(participantId));

      // 시스템 메시지 추가
      if (participantName && participantName !== "undefined") {
        this.dispatch(addSystemMessage(`${participantName}님이 퇴장했습니다.`));
      }
    }
  }

  private hasAddedWelcomeMessage = false; // 환영 메시지 중복 방지

  public handleRoomJoined(roomId?: string) {
    const roomIdToUse = roomId || this.currentRoomId;
    console.log(`💬 [CLIENT] 🏠 Joined room: ${roomIdToUse} (currentRoomId: ${this.currentRoomId})`);
    
    // roomId가 null이고 파라미터도 없으면 URL에서 가져오기
    if (!roomIdToUse) {
      const pathRoomId = (() => {
        const path = window.location.pathname;
        const matches = path.match(/\/groupchat\/([^\/\?#]+)/);
        return matches ? decodeURIComponent(matches[1]) : null;
      })();
      
      console.log(`💬 [CLIENT] ⚠️ No roomId available, using path roomId: ${pathRoomId}`);
      
      if (pathRoomId && !this.currentRoomId) {
        console.log(`💬 [CLIENT] 🔄 Re-setting room info from path: ${pathRoomId}`);
        // Redux에서 userName 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserName = urlParams.get('userName') || 
                           localStorage.getItem('userName') || 
                           sessionStorage.getItem('userName') || 
                           '게스트';
        this.setRoomInfo(pathRoomId, urlUserName);
      }
    }
    
    // 환영 메시지 중복 방지
    if (this.dispatch && !this.hasAddedWelcomeMessage) {
      this.dispatch(addSystemMessage("채팅을 시작해보세요!"));
      this.hasAddedWelcomeMessage = true;
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
      this.isInitialized = false;
      this.hasAddedWelcomeMessage = false; // 환영 메시지 플래그 리셋
    }
  }

  // 🆕 채팅방 정보 처리
  public handleChatInfo(data: {
    roomId?: string;
    participantsCount?: number;
    participants?: Array<{
      id: string;
      name: string;
      joinedAt: string;
      isTyping?: boolean;
    }>;
    error?: string;
  }) {
    console.log(`💬 [CLIENT] 📋 Received chat info:`, data);

    if (data.error) {
      console.error(`💬 [CLIENT] ❌ Chat info error: ${data.error}`);
      return;
    }

    if (this.dispatch && data.participants && data.participantsCount !== undefined) {
      // 자신을 제외한 참가자만 필터링
      const participants: ChatParticipant[] = data.participants
        .filter(p => p.name !== this.currentUserName)
        .map((p) => ({
          id: p.id,
          name: p.name,
          joinedAt: p.joinedAt,
          isTyping: p.isTyping || false,
        }));

      this.dispatch(
        setChatInfo({
          participantsCount: data.participantsCount,
          participants,
        })
      );
    }
  }

  // 🆕 채팅방 입장 완료 처리
  public handleChatJoined(data: {
    success: boolean;
    roomId?: string;
    participant?: {
      id: string;
      name: string;
      joinedAt: string;
    };
    error?: string;
  }) {
    console.log(`💬 [CLIENT] ✅ Chat joined result:`, data);

    if (!data.success) {
      console.error(`💬 [CLIENT] ❌ Failed to join chat: ${data.error}`);
      if (this.dispatch) {
        this.dispatch(addSystemMessage(`채팅방 입장 실패: ${data.error}`));
      }
      return;
    }

    // 입장 성공 시 채팅방 정보 다시 요청
    if (this.currentRoomId && data.success) {
      setTimeout(() => {
        chatHandler.getChatInfo({ roomId: this.currentRoomId! });
      }, 200);
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
