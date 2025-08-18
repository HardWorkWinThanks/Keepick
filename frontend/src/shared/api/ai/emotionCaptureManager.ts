// src/shared/api/ai/emotionCaptureManager.ts

import { EmotionData, CapturedFrame } from "@/shared/types/ai.types";
import { addCapturedEmotionFrame } from "@/entities/video-conference/ai/model/aiSlice";
import { AppDispatch } from "@/shared/config/store";

class EmotionCaptureManager {
  private dispatch: AppDispatch | null = null;
  private localVideoTrack: MediaStreamTrack | null = null; // AIVideoProcessor에서 주입받을 로컬 비디오 트랙

  private CAPTURE_COOLDOWN = 3000; // 3초 쿨다운: 이 시간 내에는 연속 캡처 방지
  private lastCaptureTime = 0; // 마지막 캡처 시간

  /**
   * EmotionCaptureManager를 초기화합니다.
   * @param dispatch Redux dispatch 함수
   */
  public init(dispatch: AppDispatch): void {
    this.dispatch = dispatch;
    console.log("EmotionCaptureManager initialized.");
  }

  /**
   * 현재 활성화된 로컬 비디오 트랙을 설정합니다.
   * 이 트랙에서 프레임을 캡처합니다.
   * @param track 캡처할 MediaStreamTrack (비디오 전용)
   */
  public setLocalVideoTrack(track: MediaStreamTrack): void {
    if (track.kind === "video") {
      this.localVideoTrack = track;
      console.log("EmotionCaptureManager: Local video track set.");
    }
  }

  /**
   * 감정 데이터가 감지되었을 때 호출되어, 비디오 프레임을 캡처합니다.
   * 쿨다운이 적용되어 일정 시간 내에는 중복 캡처되지 않습니다.
   * @param emotionData 캡처 당시 감지된 감정 데이터
   */
  public async captureEmotionFrame(emotionData: EmotionData): Promise<void> {
    // Redux dispatch와 로컬 비디오 트랙이 없으면 캡처 불가
    if (!this.dispatch || !this.localVideoTrack) {
      console.warn(
        "EmotionCaptureManager: Cannot capture frame. Dispatch or local video track not set."
      );
      return;
    }

    // 쿨다운 체크: 쿨다운 기간 중이면 캡처하지 않고 함수 종료
    const now = Date.now();
    if (now - this.lastCaptureTime < this.CAPTURE_COOLDOWN) {
      console.log("EmotionCaptureManager: Capture is in cooldown. Skipping frame.");
      return;
    }

    this.lastCaptureTime = now; // 마지막 캡처 시간 업데이트

    // 비디오 요소를 임시로 생성하여 트랙을 연결하고 프레임을 그립니다.
    const videoElem = document.createElement("video");
    videoElem.srcObject = new MediaStream([this.localVideoTrack]);
    videoElem.autoplay = true;
    videoElem.muted = true;
    videoElem.style.display = "none"; // 화면에 보이지 않도록 숨깁니다.
    document.body.appendChild(videoElem); // DOM에 추가 (onloadedmetadata 이벤트 발생을 위해)

    // 비디오 메타데이터가 로드될 때까지 기다립니다.
    await new Promise<void>((resolve) => {
      videoElem.onloadedmetadata = () => {
        videoElem.play(); // 비디오 재생 시작
        resolve();
      };
      // 에러 처리: 비디오 로드 실패 시
      videoElem.onerror = (e) => {
        console.error("EmotionCaptureManager: Error loading video for capture:", e);
        resolve(); // 에러 발생 시에도 Promise를 해결하여 다음 단계로 넘어갈 수 있게 함
      };
    });

    // 캔버스 요소를 생성하여 비디오 프레임을 그립니다.
    const canvas = document.createElement("canvas");
    // 비디오의 실제 해상도를 캔버스 크기로 사용 (Fallback 포함)
    canvas.width = videoElem.videoWidth || 640;
    canvas.height = videoElem.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("EmotionCaptureManager: Failed to get 2D context for capture canvas.");
      videoElem.remove(); // 사용한 video 요소 제거
      return;
    }

    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png"); // 캔버스 내용을 Base64 PNG 이미지로 추출

    // 캡처된 프레임 데이터를 Redux 스토어에 디스패치합니다.
    const capturedFrame: CapturedFrame = {
      id: `${emotionData.userId}_${emotionData.timestamp}_${emotionData.emotion}`, // 고유 ID 생성
      imageDataUrl: dataUrl,
      emotionData: emotionData,
      timestamp: now,
    };

    this.dispatch(addCapturedEmotionFrame(capturedFrame));
    console.log(`[EmotionCaptureManager] Captured emotion frame added: ${capturedFrame.id}`);

    videoElem.remove(); // 사용한 video 요소 제거 (메모리 해제)
  }

  /**
   * EmotionCaptureManager 인스턴스를 정리합니다.
   * 설정된 트랙과 dispatch를 해제합니다.
   */
  public cleanup(): void {
    this.dispatch = null;
    this.localVideoTrack = null;
    this.lastCaptureTime = 0;
    console.log("EmotionCaptureManager cleaned up.");
  }
}

export const emotionCaptureManager = new EmotionCaptureManager();
