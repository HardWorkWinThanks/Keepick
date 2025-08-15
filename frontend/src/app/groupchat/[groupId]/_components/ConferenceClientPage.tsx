// src/app/[groupId]/_components/ConferenceClientPage.tsx

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { ConferenceLayout } from "@/widgets/video-conference/ConferenceLayout";
import { Lobby } from "@/widgets/video-conference/lobby/ui/Lobby";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { initializeSocketApi, webrtcHandler, chatHandler } from "@/shared/api/socket";

interface ConferenceClientPageProps {
  roomId: string;
}

export const ConferenceClientPage = ({ roomId }: ConferenceClientPageProps) => {
  const dispatch = useAppDispatch();
  const { isInRoom, error, status } = useAppSelector((state) => state.session);
  const isJoining = status === "pending";

  useEffect(() => {
    const initializeSystems = async () => {
      try {
        await mediasoupManager.init(dispatch);
        initializeSocketApi(dispatch);
        console.log("✅ All systems initialized successfully.");
      } catch (e) {
        console.error("❌ Failed to initialize systems:", e);
      }
    };

    initializeSystems();

    return () => {
      console.log("🧹 Cleaning up conference page resources...");
      webrtcHandler.leaveRoom();
      chatHandler.leaveChat({ roomId });
    };
  }, [dispatch, roomId]);

  const handleJoin = async (userName: string) => {
    if (roomId && userName) {
      try {
        console.log(`🚀 Joining room: ${roomId}, user: ${userName}`);
        webrtcHandler.joinRoom({ roomId, userName });
        chatHandler.joinChat({ roomId, userName });
      } catch (e) {
        console.error("❌ Failed to join room:", e);
      }
    }
  };

  if (!isInRoom) {
    return (
      <Lobby
        onJoin={handleJoin}
        isLoading={isJoining}
        error={error}
      />
    );
  }

  return <ConferenceLayout />;
};
