// src/app/groupchat/[groupId]/page.tsx

import { Metadata } from "next";
import { VideoConference } from "@/widgets/video-conference/ui/VideoConference";

interface GroupChatPageProps {
  params: {
    groupId: string;
  };
}

/**
 * 1. 메타데이터 생성 함수 수정
 *    generateMetadata는 원래부터 async 함수이므로, params를 사용하기 전에 await만 추가하면 됩니다.
 */
export async function generateMetadata({
  params,
}: GroupChatPageProps): Promise<Metadata> {
  // FIX: params 객체 자체를 await하여 실제 값을 가져옵니다.
  const { groupId: roomId } = await params;

  return {
    title: `그룹 통화 - ${roomId}`,
    description: `그룹 ${roomId}에서 화상 통화에 참여하세요.`,
  };
}

/**
 * 2. 페이지 컴포넌트 수정
 *    마찬가지로 컴포넌트를 async 함수로 만들고, params를 사용하기 전에 await를 추가합니다.
 */
const GroupChatPage = async ({ params }: GroupChatPageProps) => {
  // FIX: params 객체 자체를 await하여 실제 값을 가져옵니다.
  const { groupId: roomId } = await params;

  // 이제 roomId는 실제 문자열 값을 가지므로, VideoConference에 안전하게 전달할 수 있습니다.
  return <VideoConference initialRoomId={roomId} />;
};

export default GroupChatPage;
