// src/app/groupchat/[groupId]/page.tsx
import { Metadata } from "next";
import { VideoConference } from "@/widgets/video-conference/ui/VideoConference";

interface GroupChatPageProps {
  params: {
    groupId: string;
  };
}

// generateMetadata는 이미 async 함수이므로 params를 await 하기만 하면 됩니다.
export async function generateMetadata({
  params,
}: GroupChatPageProps): Promise<Metadata> {
  // FIX: params는 이제 Promise이므로, 사용하기 전에 await 해야 합니다.
  const { groupId: roomId } = await params;

  return {
    title: `그룹 통화 - ${roomId}`,
    description: `그룹 ${roomId}에서 화상 통화에 참여하세요.`,
  };
}

// 페이지 컴포넌트도 async 함수로 변경해야 합니다.
const GroupChatPage = async ({ params }: GroupChatPageProps) => {
  // FIX: params는 이제 Promise이므로, 사용하기 전에 await 해야 합니다.
  const { groupId: roomId } = await params;

  return <VideoConference initialRoomId={roomId} />;
};

export default GroupChatPage;
