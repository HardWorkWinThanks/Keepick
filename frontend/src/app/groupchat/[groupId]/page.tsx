import { Metadata } from "next";
import { VideoConference } from "@/widgets/video-conference/ui/VideoConference";

interface GroupChatPageProps {
  params: {
    groupId: string;
  };
}

export async function generateMetadata({
  params,
}: GroupChatPageProps): Promise<Metadata> {
  const roomId = params.groupId;

  return {
    title: `그룹 통화 - ${roomId}`,
    description: `그룹 ${roomId}에서 화상 통화에 참여하세요.`,
  };
}

const GroupChatPage = ({ params }: GroupChatPageProps) => {
  const roomId = params.groupId;
  return <VideoConference initialRoomId={roomId} />;
};

export default GroupChatPage;
