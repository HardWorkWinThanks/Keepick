import Link from "next/link";

type InvitePageProps = {
  params: Promise<{ inviteToken: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;

  console.log("초대 토큰:", inviteToken);

  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.ssafy.keepick";

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>KeePick 그룹 초대</h1>
      <p>초대에 응하려면 KeePick 앱이 필요합니다.</p>
      <p>아래 버튼을 눌러 앱을 설치하거나 실행해주세요.</p>
      <br />
      <Link href={playStoreUrl} passHref>
        <button
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Google Play Store로 이동
        </button>
      </Link>
    </div>
  );
}
