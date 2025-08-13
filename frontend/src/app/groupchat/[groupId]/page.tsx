import type { Metadata } from "next";
// --- 우리가 만든 클라이언트 페이지 컴포넌트를 import 합니다. ---
import { ConferenceClientPage } from "./_components/ConferenceClientPage";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { groupId: roomId } = await params;

  return {
    title: `그룹 통화 - ${roomId}`,
    description: `그룹 ${roomId}에서 화상 통화에 참여하세요.`,
  };
}

// 이 컴포넌트는 서버에서 실행됩니다.
const GroupChatPage = async ({ params }: PageProps) => {
  const { groupId: roomId } = await params;

  // 서버에서 얻은 roomId를 클라이언트 컴포넌트에 prop으로 전달합니다.
  return <ConferenceClientPage roomId={roomId} />;
};

export default GroupChatPage;
