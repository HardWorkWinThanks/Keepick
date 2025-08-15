// src/shared/api/socket/gestureHandler.ts

import { Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import { GestureData, GestureEffectData, GestureStatusData } from "@/shared/types/socket.types";

class GestureHandler {
  private socket: Socket | null = null;

  public initialize(socket: Socket, dispatch: AppDispatch) {
    this.socket = socket;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;
    
    this.socket.on("gesture_detected", (data: GestureData | GestureEffectData) => {
      console.log("🤲 [GestureHandler] Received gesture_detected:", data);

      if ('gestureType' in data) {
        if (data.gestureType === "static") {
          window.dispatchEvent(new CustomEvent("gestureStaticReceived", { detail: data }));
        } else if (data.gestureType === "dynamic") {
          window.dispatchEvent(new CustomEvent("gestureDynamicReceived", { detail: data }));
        }
      } else if ('effect' in data) {
        window.dispatchEvent(new CustomEvent("gestureEffectReceived", { detail: data }));
      }
    });
  }

  private emit(event: string, ...args: unknown[]) {
      this.socket?.emit(event, ...args);
  }

  public broadcastGesture = (data: GestureData | GestureEffectData) => this.emit("gesture_detect", data);
  public broadcastStaticGesture = (data: GestureData) => this.broadcastGesture({ ...data, gestureType: "static" });
  public broadcastDynamicGesture = (data: GestureData) => this.broadcastGesture({ ...data, gestureType: "dynamic" });
  public broadcastGestureEffect = (data: GestureEffectData) => this.emit("gesture_detect", data);
  public broadcastGestureStatus = (data: GestureStatusData) => {
      console.log(`⚙️ [GestureHandler] Status: static=${data.staticGestureEnabled}, dynamic=${data.dynamicGestureEnabled}`);
  };
}

export const gestureHandler = new GestureHandler();
