// features/profile/api/profileApi.ts
import { apiClient } from "@/shared/api/http";
import { User } from "@/entities/user/model/userSlice";
import axios from "axios";
import { ApiResponse } from "@/shared/api/http";

// PreSignedUrl 요청 타입
interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  width: number;
  height: number;
  takenAt: string;
}

// PreSignedUrl 응답 타입
interface PresignedUrlResponse {
  status: number;
  message: string;
  data: PresignedUrlResponseData;
}

interface PresignedUrlResponseData {
  presignedUrl: string;
  publicUrl: string;
}

// API 응답 타입
interface UserUpdateResponse {
  status: number;
  data: User;
  message: string;
}

export const profileApi = {
  // 닉네임 중복 확인 구현 필요
  checkNicknameAvailability: () => {
    console.log("닉네임 중복 확인 기능 필요");
    return undefined;
  },

  // 사용자 정보 업데이트 (모든 필드 지원)
  updateUserInfo: async (updateData: {
    nickname?: string;
    profileUrl?: string;
    identificationUrl?: string;
  }): Promise<User> => {
    const response = await apiClient.patch<UserUpdateResponse>(
      "/api/members/me",
      updateData
    );
    return response.data.data;
  },

  // PreSignedUrl 요청 (+PublicUrl)
  getPresignedUrl: async (
    fileInfo: PresignedUrlRequest
  ): Promise<PresignedUrlResponseData> => {
    const response = await apiClient.post<ApiResponse<PresignedUrlResponseData>>(
      "/api/photos/presigned-url",
      fileInfo
    );
    // console.log('전체 응답', response.data)
    return response.data.data;
  },

  // S3에 파일 업로드
  uploadToS3: async (presignedUrl: string, file: File): Promise<string> => {
    await axios.put(presignedUrl, file, {
      headers: { "Content-Type": file.type },
      timeout: 30000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return presignedUrl.split("?")[0];
  },
};
