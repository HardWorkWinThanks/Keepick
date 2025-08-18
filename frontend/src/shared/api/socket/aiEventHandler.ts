// src/shared/api/socket/aiEventHandler.ts
import { Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import { addReaction, type EmojiReaction } from "@/entities/emoji-reaction/model/slice";

export interface AiEventData {
  roomId: string;
  userId: string;
  userName: string;
  reaction: Omit<EmojiReaction, 'id'>;
}

class AiEventHandler {
  private socket: Socket | null = null;
  private dispatch: AppDispatch | null = null;
  private currentRoomId: string = "";
  private currentUserId: string = "local";
  private currentUserName: string = "";

  public init(socket: Socket, dispatch: AppDispatch): void {
    this.socket = socket;
    this.dispatch = dispatch;
    this.setupEventListeners();
    console.log("🤖 AiEventHandler initialized");
  }

  public setUserInfo(userId: string, userName: string): void {
    this.currentUserId = userId;
    this.currentUserName = userName;
    console.log(`👤 AI event user info set: ${userName} (${userId})`);
  }

  public setRoomId(roomId: string): void {
    this.currentRoomId = roomId;
    console.log(`🏠 AI event room ID set: ${roomId}`);
  }

  // AI 이벤트 전송
  public sendAiReaction(reaction: Omit<EmojiReaction, 'id'>): void {
    if (!this.socket || !this.currentRoomId) {
      console.warn("⚠️ Cannot send AI reaction: socket or room not ready");
      return;
    }

    const eventData: AiEventData = {
      roomId: this.currentRoomId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      reaction
    };

    this.socket.emit("gesture_detect", eventData);
    console.log("📡 Gesture detection sent:", eventData);
  }

  private setupEventListeners(): void {
    if (!this.socket || !this.dispatch) return;

    // 다른 사용자의 제스처 감지 결과 수신
    this.socket.on("gesture_detected", (data: AiEventData) => {
      console.log("📨 Gesture detection received:", data);

      // 자신의 반응은 무시 (이미 로컬에서 추가됨)
      if (data.userId === this.currentUserId) {
        console.log("🚫 Ignoring own AI reaction");
        return;
      }

      // 수신된 반응을 Redux에 추가
      const fullReaction: EmojiReaction = {
        id: `remote_${data.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        ...data.reaction,
        userId: data.userId,
        userName: data.userName
      };

      this.dispatch!(addReaction(fullReaction));
      console.log("✅ Remote gesture detection added to Redux:", fullReaction);
    });

    // 연결 상태 로깅
    this.socket.on("connect", () => {
      console.log("🔗 AI event socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 AI event socket disconnected");
    });
  }

  public cleanup(): void {
    if (this.socket) {
      this.socket.off("gesture_detect");
      this.socket.off("connect");
      this.socket.off("disconnect");
    }
    
    this.socket = null;
    this.dispatch = null;
    this.currentRoomId = "";
    this.currentUserId = "local";
    this.currentUserName = "";
    
    console.log("🧹 AiEventHandler cleaned up");
  }
}

export const aiEventHandler = new AiEventHandler();