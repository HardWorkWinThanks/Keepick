import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/shared/config/store";
import { webrtcHandler } from "@/shared/api/socket";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import { consumeNewProducerThunk } from "@/entities/video-conference/consume-stream/model/thunks";
import { resetRoomState, setUsers, setRoomId } from "./slice"; // setRoomId, setUsers를 같은 폴더의 slice에서 가져옴
import { resetMediaState } from "@/entities/video-conference/media/model/slice";
import { resetWebrtcState } from "@/entities/video-conference/webrtc/model/slice";
import { RtpCapabilities } from "mediasoup-client/types";
import { User } from "@/shared/types/webrtc.types";
import { setInRoom } from "./slice";

// ====================================================================
// 1. [요청 단계] 방 참여 요청 및 로컬 미디어 준비 Thunk
// ====================================================================
export const joinRoomThunk = createAsyncThunk(
  "session/joinRoom",
  async (
    { roomId, userName }: { roomId: string; userName: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      console.log("[1] joinRoomThunk: 로컬 미디어 초기화 시작");
      // 새로운 구조에서는 자동으로 처리됨
      // await mediasoupManager.startLocalMedia();

      // 방에 참여하기 전에 Redux 상태에 roomId를 먼저 저장합니다.
      dispatch(setRoomId(roomId));

      console.log("[2] joinRoomThunk: webrtcHandler.joinRoom 호출 (요청만 보냄)");
      // 서버에 방 참여를 요청합니다. 반환값을 기다리지 않습니다. (Fire-and-Forget)
      webrtcHandler.joinRoom({ roomId, userName });

      // Thunk는 성공적으로 요청을 보냈다는 사실만 반환합니다.
      return { roomId, userName };
    } catch (error: any) {
      console.error("❌ Failed to initiate join room process:", error);
      mediasoupManager.cleanup(); // 실패 시 미디어 리소스 정리
      return rejectWithValue(error.message);
    }
  }
);

// ====================================================================
// 2. [설정 단계] WebRTC 설정 및 스트림 교환을 위한 Thunk
// (이 Thunk는 UI가 아닌 socketApi의 이벤트 리스너가 호출합니다)
// ====================================================================
export const setupConferenceThunk = createAsyncThunk(
  "session/setupConference",
  async (
    { rtpCapabilities, peers }: { rtpCapabilities: RtpCapabilities; peers: User[] },
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as RootState;
    const roomId = state.session.roomId; // joinRoomThunk가 저장한 roomId를 가져옵니다.

    if (!roomId) {
      return rejectWithValue("Room ID is not set. Cannot setup conference.");
    }

    try {
      dispatch(setInRoom(true));
      console.log("[3] setupConferenceThunk: WebRTC 설정 시작", {
        rtpCapabilities,
        peers,
      });

      // 1. 서버로부터 받은 유저 목록을 Redux에 저장
      dispatch(setUsers(peers));

      // 2. 새로운 구조에서는 자동으로 처리됨
      // await mediasoupManager.loadDevice(rtpCapabilities);
      // await mediasoupManager.createTransports(roomId);
      // await mediasoupManager.startLocalMedia();
      console.log("[4] setupConferenceThunk: Producing 시작 완료");

      // 5. 이미 방에 있던 다른 참여자들의 스트림을 수신(Consume) 시작
      console.log("[5] setupConferenceThunk: 기존 참여자 스트림 Consume 시작");
      for (const peer of peers) {
        if (peer.producers) {
          for (const producerInfo of peer.producers) {
            dispatch(
              consumeNewProducerThunk({
                producerId: producerInfo.producerId,
                producerSocketId: peer.id,
              })
            );
          }
        }
      }
      console.log("[6] setupConferenceThunk: 모든 설정 완료");
    } catch (error: any) {
      console.error("❌ Failed to setup conference:", error);
      mediasoupManager.cleanup();
      // 설정 과정에서 실패하면 방을 나가는 로직을 실행합니다.
      dispatch(leaveRoomThunk());
      return rejectWithValue(error.message);
    }
  }
);

// ====================================================================
// 3. [종료 단계] 방 나가기 Thunk
// ====================================================================
export const leaveRoomThunk = createAsyncThunk(
  "session/leaveRoom",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // 새로운 구조에서는 직접 호출
      webrtcHandler.leaveRoom();
      mediasoupManager.cleanup();

      // 모든 관련 상태를 초기화합니다.
      dispatch(resetRoomState());
      dispatch(resetMediaState());
      dispatch(resetWebrtcState());

      console.log("✅ Successfully left the room");
    } catch (error: any) {
      console.error("❌ Failed to leave room:", error);
      return rejectWithValue(error.message);
    }
  }
);
